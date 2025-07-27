const fetch = require('node-fetch');

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
                body: JSON.stringify({ error: '검색 키워드가 필요합니다.' })
            };
        }

        console.log(`네이버 검색: ${keyword}`);

        // 네이버 API 키
        const NAVER_CLIENT_ID = 'uJe_p8n0flxX6BOODU3E';
        const NAVER_CLIENT_SECRET = 'VaiXA1dTGw';

        // 네이버 검색 API 호출
        const apiUrl = 'https://openapi.naver.com/v1/search/blog.json';
        const queryParams = new URLSearchParams({
            query: keyword,
            display: 10,
            start: 1,
            sort: 'sim' // 정확도순
        });

        const response = await fetch(`${apiUrl}?${queryParams}`, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });

        if (!response.ok) {
            throw new Error(`네이버 API 오류: ${response.status}`);
        }

        const data = await response.json();
        
        console.log(`검색 결과: ${data.total}개`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                total: data.total || 0,
                items: data.items || [],
                query: keyword
            })
        };
        
    } catch (error) {
        console.error('네이버 검색 오류:', error);
        
        // API 오류시 시뮬레이션 결과 반환
        const isMyBlogPost = keyword.includes('site:blog.naver.com/');
        const total = isMyBlogPost ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 1000);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                total,
                items: [],
                simulated: true
            })
        };
    }
};
