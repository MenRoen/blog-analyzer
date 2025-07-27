const fetch = require('node-fetch');

// 네이버 API 설정
const NAVER_CLIENT_ID = "7inWZfwgXJuHZ6fo9qAr";
const NAVER_CLIENT_SECRET = "ECaOcIunu0";

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
        const { keyword, blogId } = JSON.parse(event.body);
        
        if (!keyword || !blogId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '키워드와 블로그 ID가 필요합니다.' })
            };
        }

        // 네이버 블로그 검색 API 호출
        const url = 'https://openapi.naver.com/v1/search/blog.json';
        const params = new URLSearchParams({
            query: keyword,
            display: '100',
            sort: 'sim'
        });

        const response = await fetch(`${url}?${params}`, {
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });

        if (!response.ok) {
            throw new Error(`네이버 API 오류: ${response.status}`);
        }

        const data = await response.json();
        const total = data.total || 0;
        const items = data.items || [];

        // 내 블로그 순위 찾기
        let myRank = null;
        let myPost = null;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].bloggerlink && items[i].bloggerlink.includes(blogId)) {
                myRank = i + 1;
                myPost = items[i];
                break;
            }
        }

        // 경쟁도 판단
        let difficulty = '확인불가';
        if (total > 50000) {
            difficulty = '높음';
        } else if (total > 10000) {
            difficulty = '중간';
        } else if (total > 0) {
            difficulty = '낮음';
        }

        // 연관 키워드 추출
        const relatedKeywords = extractRelatedKeywords(items, keyword);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                rank: myRank || '100위 밖',
                total: total,
                difficulty: difficulty,
                myPost: myPost,
                relatedKeywords: relatedKeywords,
                searchVolume: total
            })
        };

    } catch (error) {
        console.error('순위 확인 오류:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: '순위 확인 중 오류가 발생했습니다.',
                message: error.message 
            })
        };
    }
};

// 연관 키워드 추출 함수
function extractRelatedKeywords(items, baseKeyword) {
    const keywords = {};
    const patterns = [
        '매매', '전세', '월세', '시세', '분양', '평면도',
        '학군', '교통', '주차', '관리비', '커뮤니티', '단지',
        '리모델링', '재건축', '입주', '호가', '실거래',
        '학교', '역세권', '상가', '편의시설', '조망', '층수',
        '평형', '타입', '옵션', '인테리어', '이사', '청소',
        '커튼', '블라인드', '암막', '롤스크린', '버티컬'
    ];
    
    items.forEach(item => {
        const text = (item.title + ' ' + item.description).replace(/<[^>]*>/g, '');
        
        patterns.forEach(pattern => {
            if (text.includes(pattern) && !baseKeyword.includes(pattern)) {
                const fullKeyword = `${baseKeyword} ${pattern}`;
                keywords[fullKeyword] = (keywords[fullKeyword] || 0) + 1;
            }
        });
    });
    
    // 상위 10개 추출
    return Object.entries(keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);
}
