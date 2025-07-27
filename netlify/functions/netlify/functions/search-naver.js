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
        const { keyword } = JSON.parse(event.body);
        
        if (!keyword) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '키워드가 필요합니다.' })
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

        // 응답 데이터 가공
        const result = {
            total: data.total || 0,
            items: (data.items || []).map(item => ({
                title: item.title,
                description: item.description,
                bloggerlink: item.bloggerlink,
                bloggername: item.bloggername,
                postdate: item.postdate,
                link: item.link
            }))
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('검색 오류:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: '검색 중 오류가 발생했습니다.',
                message: error.message 
            })
        };
    }
};
