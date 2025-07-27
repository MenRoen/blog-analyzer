const fetch = require('node-fetch');

// 지역 코드 매핑
const REGION_CODES = {
    // 서울
    "종로구": "11110", "중구": "11140", "용산구": "11170", "성동구": "11200",
    "광진구": "11215", "동대문구": "11230", "중랑구": "11260", "성북구": "11290",
    "강북구": "11305", "도봉구": "11320", "노원구": "11350", "은평구": "11380",
    "서대문구": "11410", "마포구": "11440", "양천구": "11470", "강서구": "11500",
    "구로구": "11530", "금천구": "11545", "영등포구": "11560", "동작구": "11590",
    "관악구": "11620", "서초구": "11650", "강남구": "11680", "송파구": "11710",
    "강동구": "11740",
    // 경기 주요
    "수원시": "41110", "성남시": "41130", "의정부시": "41150", "안양시": "41170",
    "부천시": "41190", "광명시": "41210", "평택시": "41220", "안산시": "41270",
    "고양시": "41280", "과천시": "41290", "구리시": "41310", "남양주시": "41360",
    "오산시": "41370", "시흥시": "41390", "군포시": "41410", "의왕시": "41430",
    "하남시": "41450", "용인시": "41460", "파주시": "41480", "이천시": "41500",
    "안성시": "41550", "김포시": "41570", "화성시": "41590", "광주시": "41610",
    "양주시": "41630", "포천시": "41650",
    // 인천
    "중구": "28110", "동구": "28140", "미추홀구": "28177", "연수구": "28185",
    "남동구": "28200", "부평구": "28237", "계양구": "28245", "서구": "28260",
    // 부산
    "해운대구": "26350", "수영구": "26500", "광안리": "26500",
    // 기타 광역시
    "유성구": "30200", "달서구": "27290"
};

// 국토부 API 키
const MOLIT_API_KEY = "1iC0l5YNvH8eWhRJNOEAivLtGqupVFDs/uoKQRh8JtHUq59PXUgJ2/IsLrm1V/jcJViFsyV8pwro+mGTlbLmag==";

exports.handler = async (event, context) => {
    // CORS 헤더
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { region } = JSON.parse(event.body);
        
        if (!region) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '지역이 필요합니다.' })
            };
        }

        const apartments = {};
        const currentDate = new Date();
        const regionCode = REGION_CODES[region];
        
        console.log(`지역: ${region}, 코드: ${regionCode}`);
        
        if (regionCode) {
            // 최근 3개월 데이터 조회
            for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                const targetDate = new Date(currentDate);
                targetDate.setMonth(targetDate.getMonth() - monthOffset);
                const yearMonth = targetDate.getFullYear() + String(targetDate.getMonth() + 1).padStart(2, '0');
                
                const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade`;
                const params = new URLSearchParams({
                    serviceKey: MOLIT_API_KEY,
                    pageNo: '1',
                    numOfRows: '500', // 최대한 많이 가져오기
                    LAWD_CD: regionCode,
                    DEAL_YMD: yearMonth
                });
                
                try {
                    const response = await fetch(`${url}?${params}`);
                    const text = await response.text();
                    
                    // XML 파싱
                    const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
                    
                    items.forEach(itemXml => {
                        const getTagValue = (tag) => {
                            const match = itemXml.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`));
                            return match ? match[1].trim() : '';
                        };
                        
                        const aptName = getTagValue('아파트');
                        const dong = getTagValue('법정동');
                        
                        if (aptName && dong) {
                            const key = `${dong}_${aptName}`;
                            
                            if (!apartments[key]) {
                                apartments[key] = {
                                    name: aptName,
                                    dong: dong.replace(/[0-9]/g, '').trim(), // 숫자 제거
                                    prices: [],
                                    buildYear: getTagValue('건축년도'),
                                    trades: [],
                                    totalHouseholds: parseInt(getTagValue('세대수')) || 0,
                                    region: region
                                };
                            }
                            
                            const price = parseInt(getTagValue('거래금액').replace(/,/g, ''));
                            apartments[key].prices.push(price);
                            
                            const tradeDate = new Date(
                                getTagValue('년'),
                                parseInt(getTagValue('월')) - 1,
                                getTagValue('일')
                            );
                            
                            apartments[key].trades.push({
                                price: getTagValue('거래금액'),
                                date: tradeDate,
                                area: getTagValue('전용면적'),
                                floor: getTagValue('층')
                            });
                        }
                    });
                } catch (error) {
                    console.error(`${yearMonth} 데이터 조회 오류:`, error);
                }
                
                // API 제한 회피
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // 네이버 검색으로 보완
        if (Object.keys(apartments).length < 20) {
            const searchKeywords = [
                `${region} 아파트`,
                `${region} 아파트 시세`,
                `${region} 신축 아파트`,
                `${region} 래미안`,
                `${region} 자이`,
                `${region} 아이파크`,
                `${region} 푸르지오`,
                `${region} 힐스테이트`
            ];
            
            for (const keyword of searchKeywords) {
                try {
                    // 네이버 검색은 search-naver 함수 활용
                    console.log(`검색: ${keyword}`);
                } catch (error) {
                    console.error('네이버 검색 오류:', error);
                }
            }
        }
        
        // 데이터 정리
        const apartmentList = Object.values(apartments).map(apt => {
            if (apt.prices.length > 0) {
                apt.avgPrice = Math.round(apt.prices.reduce((a, b) => a + b, 0) / apt.prices.length / 10000);
                apt.maxPrice = Math.round(Math.max(...apt.prices) / 10000);
                apt.minPrice = Math.round(Math.min(...apt.prices) / 10000);
            } else {
                apt.avgPrice = 0;
                apt.maxPrice = 0;
                apt.minPrice = 0;
            }
            
            // 최근 거래량
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            apt.recentTrades = apt.trades.filter(t => t.date >= oneWeekAgo).length;
            apt.totalTrades = apt.trades.length;
            
            // 검색량 (임시)
            apt.searchVolume = Math.floor(Math.random() * 20000 + 5000);
            
            // 입주 정보 (임시)
            if (Math.random() > 0.9) {
                apt.moveInDays = -Math.floor(Math.random() * 60);
                apt.moveInStatus = `D${apt.moveInDays}`;
            } else if (Math.random() > 0.95) {
                apt.moveInDays = Math.floor(Math.random() * 90);
                apt.moveInStatus = `입주 ${Math.floor(apt.moveInDays / 30)}개월`;
            }
            
            return apt;
        });
        
        console.log(`총 ${apartmentList.length}개 아파트 수집`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                apartments: apartmentList
            })
        };
        
    } catch (error) {
        console.error('전체 오류:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: '아파트 데이터 수집 중 오류가 발생했습니다.',
                message: error.message 
            })
        };
    }
};
