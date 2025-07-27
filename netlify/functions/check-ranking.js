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
        const { keyword, blogId } = JSON.parse(event.body);
        
        if (!keyword || !blogId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '키워드와 블로그 ID가 필요합니다.' })
            };
        }

        console.log(`순위 확인: ${keyword} for blog ${blogId}`);

        // 랜덤하게 순위 생성 (실제 구현시 제거)
        const rank = Math.random() < 0.7 ? Math.floor(Math.random() * 30) + 1 : '100위 밖';
        
        // 특정 키워드에 대해서는 더 높은 순위 부여 (시뮬레이션)
        let adjustedRank = rank;
        if (keyword.includes('커튼') && typeof rank === 'number' && rank < 50) {
            adjustedRank = Math.floor(rank * 0.8);
        }
        
        console.log(`결과: ${keyword} - ${adjustedRank}위`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                keyword,
                blogId,
                rank: adjustedRank,
                searchDate: new Date().toISOString()
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
