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
    // 경기 - 수원시
    "수원시 장안구": "41111", "수원시 권선구": "41113", "수원시 팔달구": "41115", "수원시 영통구": "41117",
    // 경기 - 성남시
    "성남시 수정구": "41131", "성남시 중원구": "41133", "성남시 분당구": "41135",
    // 경기 - 안양시
    "안양시 만안구": "41171", "안양시 동안구": "41173",
    // 경기 - 안산시
    "안산시 상록구": "41271", "안산시 단원구": "41273",
    // 경기 - 고양시
    "고양시 덕양구": "41281", "고양시 일산동구": "41285", "고양시 일산서구": "41287",
    // 경기 - 용인시
    "용인시 처인구": "41461", "용인시 기흥구": "41463", "용인시 수지구": "41465",
    // 경기 - 단일시
    "부천시": "41190", "광명시": "41210", "평택시": "41220", "동두천시": "41250",
    "과천시": "41290", "구리시": "41310", "남양주시": "41360", "오산시": "41370",
    "시흥시": "41390", "군포시": "41410", "의왕시": "41430", "하남시": "41450",
    "파주시": "41480", "이천시": "41500", "안성시": "41550", "김포시": "41570",
    "화성시": "41590", "광주시": "41610", "양주시": "41630", "포천시": "41650",
    "의정부시": "41150", "여주시": "41670",
    // 인천
    "인천 중구": "28110", "인천 동구": "28140", "인천 미추홀구": "28177", "인천 연수구": "28185",
    "인천 남동구": "28200", "인천 부평구": "28237", "인천 계양구": "28245", "인천 서구": "28260",
    "인천 강화군": "28710", "인천 옹진군": "28720",
    // 부산
    "부산 중구": "26110", "부산 서구": "26140", "부산 동구": "26170", "부산 영도구": "26200",
    "부산 부산진구": "26230", "부산 동래구": "26260", "부산 남구": "26290", "부산 북구": "26320",
    "부산 해운대구": "26350", "부산 사하구": "26380", "부산 금정구": "26410", "부산 강서구": "26440",
    "부산 연제구": "26470", "부산 수영구": "26500", "부산 사상구": "26530", "부산 기장군": "26710",
    // 대구
    "대구 중구": "27110", "대구 동구": "27140", "대구 서구": "27170", "대구 남구": "27200",
    "대구 북구": "27230", "대구 수성구": "27260", "대구 달서구": "27290", "대구 달성군": "27710",
    // 광주
    "광주 동구": "29110", "광주 서구": "29140", "광주 남구": "29155", "광주 북구": "29170",
    "광주 광산구": "29200",
    // 대전
    "대전 동구": "30110", "대전 중구": "30140", "대전 서구": "30170", "대전 유성구": "30200",
    "대전 대덕구": "30230",
    // 울산
    "울산 중구": "31110", "울산 남구": "31140", "울산 동구": "31170", "울산 북구": "31200",
    "울산 울주군": "31710",
    // 세종
    "세종시": "36110"
};

// 국토부 API 키 (Encoding 버전 사용)
const MOLIT_API_KEY = "1iC0l5YNvH8eWhRJNOEAivLtGqupVFDs%2FuoKQRh8JtHUq59PXUgJ2%2FIsLrm1V%2FjcJViFsyV8pwro%2BmGTlbLmag%3D%3D";

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
                
                // URL 파라미터를 직접 구성
                const queryString = `serviceKey=${MOLIT_API_KEY}&pageNo=1&numOfRows=500&LAWD_CD=${regionCode}&DEAL_YMD=${yearMonth}`;
                const fullUrl = `${url}?${queryString}`;
                
                console.log(`API 호출 URL: ${url}`);
                console.log(`파라미터: LAWD_CD=${regionCode}, DEAL_YMD=${yearMonth}`);
                
                try {
                    const response = await fetch(fullUrl);
                    console.log(`API 응답 상태: ${response.status}`);
                    
                    const text = await response.text();
                    console.log(`API 응답 길이: ${text.length}`);
                    
                    // XML 응답 확인
                    if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
                        console.error('API 키 오류: 등록되지 않은 서비스 키');
                        continue;
                    }
                    
                    if (text.includes('<resultCode>')) {
                        const resultCode = text.match(/<resultCode>(\d+)<\/resultCode>/);
                        const resultMsg = text.match(/<resultMsg>(.*?)<\/resultMsg>/);
                        console.log(`API 결과 코드: ${resultCode ? resultCode[1] : 'N/A'}`);
                        console.log(`API 결과 메시지: ${resultMsg ? resultMsg[1] : 'N/A'}`);
                        
                        if (resultCode && resultCode[1] !== '00' && resultCode[1] !== '000') {
                            console.error(`API 오류: ${resultMsg ? resultMsg[1] : '알 수 없는 오류'}`);
                            continue;
                        }
                    }
                    
                    // XML 파싱
                    const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
                    console.log(`파싱된 아이템 수: ${items.length}`);
                    
                    items.forEach(itemXml => {
                        const getTagValue = (tag) => {
                            const match = itemXml.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`));
                            return match ? match[1].trim() : '';
                        };
                        
                        // 국토부 API 실제 태그명 (영문)
                        const aptName = getTagValue('aptNm');
                        const dong = getTagValue('umdNm');
                        const price = getTagValue('dealAmount');
                        const area = getTagValue('excluUseAr');
                        const year = getTagValue('dealYear');
                        const month = getTagValue('dealMonth'); 
                        const day = getTagValue('dealDay');
                        const floor = getTagValue('floor');
                        const buildYear = getTagValue('buildYear');
                        
                        if (aptName && dong) {
                            const key = `${dong}_${aptName}`;
                            
                            if (!apartments[key]) {
                                apartments[key] = {
                                    name: aptName,
                                    dong: dong.replace(/[0-9]/g, '').trim(), // 숫자 제거
                                    prices: [],
                                    buildYear: buildYear || '',
                                    trades: [],
                                    totalHouseholds: 0,
                                    region: region
                                };
                            }
                            
                            const priceNum = parseInt(price.replace(/[,\s]/g, ''));
                            apartments[key].prices.push(priceNum);
                            
                            const tradeDate = new Date(
                                parseInt(year),
                                parseInt(month) - 1,
                                parseInt(day)
                            );
                            
                            apartments[key].trades.push({
                                price: price,
                                date: tradeDate,
                                area: area,
                                floor: floor
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
