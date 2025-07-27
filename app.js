// 아파트 검색 (네이버 지도)
function searchApartment(element) {
    const aptName = element.getAttribute('data-name');
    const dong = element.getAttribute('data-dong');
    const region = selectedRegion;
    
    // 네이버 지도 부동산 검색
    const searchQuery = encodeURIComponent(`${region} ${dong} ${aptName}`);
    const naverMapUrl = `https://map.naver.com/v5/search/${searchQuery}`;
    
    window.open(naverMapUrl, '_blank');
}// 전역 변수
let selectedBlog = 'mendeco';
let selectedRegion = '';
let analysisResults = null;
let currentDong = null;
let currentSortType = 'price';

// 지역 데이터 (시/도 → 시/구/군)
const regionData = {
    '서울': {
        '종로구': '11110', '중구': '11140', '용산구': '11170', '성동구': '11200',
        '광진구': '11215', '동대문구': '11230', '중랑구': '11260', '성북구': '11290',
        '강북구': '11305', '도봉구': '11320', '노원구': '11350', '은평구': '11380',
        '서대문구': '11410', '마포구': '11440', '양천구': '11470', '강서구': '11500',
        '구로구': '11530', '금천구': '11545', '영등포구': '11560', '동작구': '11590',
        '관악구': '11620', '서초구': '11650', '강남구': '11680', '송파구': '11710',
        '강동구': '11740'
    },
    '경기': {
        '수원시 장안구': '41111', '수원시 권선구': '41113', '수원시 팔달구': '41115', '수원시 영통구': '41117',
        '성남시 수정구': '41131', '성남시 중원구': '41133', '성남시 분당구': '41135',
        '안양시 만안구': '41171', '안양시 동안구': '41173',
        '부천시': '41190', '광명시': '41210', '평택시': '41220',
        '안산시 상록구': '41271', '안산시 단원구': '41273',
        '고양시 덕양구': '41281', '고양시 일산동구': '41285', '고양시 일산서구': '41287',
        '과천시': '41290', '구리시': '41310', '남양주시': '41360', '오산시': '41370',
        '시흥시': '41390', '군포시': '41410', '의왕시': '41430', '하남시': '41450',
        '용인시 처인구': '41461', '용인시 기흥구': '41463', '용인시 수지구': '41465',
        '파주시': '41480', '이천시': '41500', '안성시': '41550', '김포시': '41570',
        '화성시': '41590', '광주시': '41610', '양주시': '41630', '포천시': '41650',
        '의정부시': '41150', '동두천시': '41250', '여주시': '41670'
    },
    '인천': {
        '중구': '28110', '동구': '28140', '미추홀구': '28177', '연수구': '28185',
        '남동구': '28200', '부평구': '28237', '계양구': '28245', '서구': '28260',
        '강화군': '28710', '옹진군': '28720'
    },
    '부산': {
        '중구': '26110', '서구': '26140', '동구': '26170', '영도구': '26200',
        '부산진구': '26230', '동래구': '26260', '남구': '26290', '북구': '26320',
        '해운대구': '26350', '사하구': '26380', '금정구': '26410', '강서구': '26440',
        '연제구': '26470', '수영구': '26500', '사상구': '26530', '기장군': '26710'
    },
    '대구': {
        '중구': '27110', '동구': '27140', '서구': '27170', '남구': '27200',
        '북구': '27230', '수성구': '27260', '달서구': '27290', '달성군': '27710'
    },
    '광주': {
        '동구': '29110', '서구': '29140', '남구': '29155', '북구': '29170',
        '광산구': '29200'
    },
    '대전': {
        '동구': '30110', '중구': '30140', '서구': '30170', '유성구': '30200',
        '대덕구': '30230'
    },
    '울산': {
        '중구': '31110', '남구': '31140', '동구': '31170', '북구': '31200',
        '울주군': '31710'
    },
    '세종': {
        '세종시': '36110'
    }
};

// 시/도 선택 시
document.getElementById('sido').addEventListener('change', function() {
    const sido = this.value;
    const gugunSelect = document.getElementById('gugun');
    
    gugunSelect.innerHTML = '<option value="">시/구/군 선택</option>';
    gugunSelect.disabled = true;
    
    if (sido && regionData[sido]) {
        Object.keys(regionData[sido]).forEach(gugun => {
            const option = document.createElement('option');
            option.value = gugun;
            option.textContent = gugun;
            gugunSelect.appendChild(option);
        });
        gugunSelect.disabled = false;
    }
});

// 블로그 선택
document.querySelectorAll('.blog-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.blog-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
        selectedBlog = this.dataset.blog;
    });
});

// 분석 시작
async function startAnalysis() {
    const sido = document.getElementById('sido').value;
    const gugun = document.getElementById('gugun').value;
    
    if (!sido || !gugun) {
        alert('지역을 선택해주세요!');
        return;
    }
    
    selectedRegion = gugun;
    
    // UI 상태 변경
    document.querySelector('.analyze-btn').disabled = true;
    document.querySelector('.loading').style.display = 'block';
    document.querySelector('.results').style.display = 'none';
    
    try {
        analysisResults = await performAnalysis(gugun);
        displayResults();
    } catch (error) {
        console.error('분석 오류:', error);
        alert('분석 중 오류가 발생했습니다.');
    } finally {
        document.querySelector('.analyze-btn').disabled = false;
        document.querySelector('.loading').style.display = 'none';
        document.querySelector('.export-btn').style.display = 'block';
    }
}

// 분석 실행
async function performAnalysis(region) {
    const results = {
        region: region,
        blog: selectedBlog,
        overallRanking: {},
        dongData: {},
        apartments: [],
        moveInSoon: [],
        recentlyMoved: []
    };
    
    updateProgress('전체 지역 순위 확인 중...');
    
    // 1. 구 전체 순위 확인
    results.overallRanking = {
        curtain: await checkRanking(`${region} 커튼`, selectedBlog),
        blind: await checkRanking(`${region} 블라인드`, selectedBlog)
    };
    
    updateProgress('아파트 데이터 수집 중...');
    
    try {
        // 2. 아파트 데이터 수집
        const apartmentData = await getApartments(region);
        results.apartments = apartmentData.apartments || [];
        
        if (results.apartments.length === 0) {
            throw new Error('아파트 데이터가 없습니다.');
        }
        
        // 3. 동별 데이터 정리
        updateProgress('동별 데이터 분석 중...');
        
        for (const apt of results.apartments) {
            const dong = apt.dong || '기타';
            
            if (!results.dongData[dong]) {
                results.dongData[dong] = {
                    name: dong,
                    count: 0,
                    apartments: [],
                    ranking: null,
                    myPosts: 0
                };
            }
            
            results.dongData[dong].count++;
            results.dongData[dong].apartments.push(apt);
            
            // 입주 예정/최근 입주 분류
            if (apt.moveInDays && apt.moveInDays >= -60 && apt.moveInDays <= 0) {
                results.moveInSoon.push(apt);
            } else if (apt.moveInDays && apt.moveInDays > 0 && apt.moveInDays <= 90) {
                results.recentlyMoved.push(apt);
            }
        }
        
        // 4. 동별 순위 확인
        updateProgress('동별 순위 확인 중...');
        
        for (const dong of Object.keys(results.dongData)) {
            const dongRanking = await checkRanking(`${dong} 커튼`, selectedBlog);
            const dongBlindRanking = await checkRanking(`${dong} 블라인드`, selectedBlog);
            const myPosts = await countMyPosts(dong, selectedBlog);
            
            results.dongData[dong].ranking = {
                curtain: dongRanking,
                blind: dongBlindRanking
            };
            results.dongData[dong].myPosts = myPosts;
            
            await delay(300);
        }
        
        // 5. 각 아파트별 순위 확인
        updateProgress('아파트별 순위 확인 중...');
        
        for (let i = 0; i < results.apartments.length; i++) {
            const apt = results.apartments[i];
            updateProgress(`아파트 분석 중... (${i + 1}/${results.apartments.length})`);
            
            apt.ranking = {
                curtain: await checkRanking(`${apt.name} 커튼`, selectedBlog),
                blind: await checkRanking(`${apt.name} 블라인드`, selectedBlog)
            };
            apt.myPosts = await countMyPosts(apt.name, selectedBlog);
            
            await delay(300);
        }
        
        return results;
        
    } catch (error) {
        console.error('분석 중 오류:', error);
        alert(error.message || '분석 중 오류가 발생했습니다.');
        throw error;
    }
}

// 아파트 데이터 가져오기
async function getApartments(region) {
    try {
        const response = await fetch('/.netlify/functions/get-apartments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region })
        });
        
        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 데이터가 없으면 에러 표시
        if (!data.apartments || data.apartments.length === 0) {
            throw new Error('해당 지역의 아파트 정보를 찾을 수 없습니다.');
        }
        
        return data;
    } catch (error) {
        console.error('아파트 데이터 수집 오류:', error);
        throw error; // 에러를 그대로 전달
    }
}

// 순위 확인
async function checkRanking(keyword, blogId) {
    try {
        const response = await fetch('/.netlify/functions/check-ranking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, blogId })
        });
        
        if (!response.ok) throw new Error('API 오류');
        
        const data = await response.json();
        return data.rank;
    } catch (error) {
        console.error('순위 확인 오류:', error);
        return '측정불가';
    }
}

// 내 포스팅 수 확인
async function countMyPosts(keyword, blogId) {
    try {
        const response = await fetch('/.netlify/functions/search-naver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: `${keyword} site:blog.naver.com/${blogId}` })
        });
        
        if (!response.ok) throw new Error('API 오류');
        
        const data = await response.json();
        return Math.min(data.total || 0, 10);
    } catch (error) {
        console.error('포스팅 수 확인 오류:', error);
        return 0;
    }
}

// 결과 표시
function displayResults() {
    document.querySelector('.results').style.display = 'block';
    
    // 1. 전체 순위 표시
    const overallDiv = document.getElementById('overallRanking');
    overallDiv.innerHTML = `
        ${selectedRegion} 커튼: <span style="color: #e74c3c">${formatRank(analysisResults.overallRanking.curtain)}</span> | 
        ${selectedRegion} 블라인드: <span style="color: #3498db">${formatRank(analysisResults.overallRanking.blind)}</span>
    `;
    
    // 2. 입주 예정 아파트
    if (analysisResults.moveInSoon.length > 0) {
        document.getElementById('moveInSection').style.display = 'block';
        const moveInList = document.getElementById('moveInList');
        moveInList.innerHTML = analysisResults.moveInSoon.map(apt => `
            <div class="move-in-item">
                <div>
                    <strong>[${apt.dong}] ${apt.name}</strong> D${apt.moveInDays} | ${apt.totalHouseholds || '?'}세대
                </div>
                <div>
                    📊 커튼: ${formatRank(apt.ranking?.curtain)} | 블라인드: ${formatRank(apt.ranking?.blind)} | 📝 내 포스팅: ${apt.myPosts || 0}개
                </div>
            </div>
        `).join('');
    }
    
    // 3. 최근 입주 아파트
    if (analysisResults.recentlyMoved.length > 0) {
        document.getElementById('recentMoveSection').style.display = 'block';
        const recentList = document.getElementById('recentMoveList');
        recentList.innerHTML = analysisResults.recentlyMoved.map(apt => `
            <div class="move-in-item">
                <div>
                    <strong>[${apt.dong}] ${apt.name}</strong> 입주 ${Math.floor(apt.moveInDays / 30)}개월 | ${apt.totalHouseholds || '?'}세대
                </div>
                <div>
                    📊 커튼: ${formatRank(apt.ranking?.curtain)} | 블라인드: ${formatRank(apt.ranking?.blind)} | 📝 내 포스팅: ${apt.myPosts || 0}개
                </div>
            </div>
        `).join('');
    }
    
    // 4. 동별 리스트
    const dongList = document.getElementById('dongList');
    const sortedDongs = Object.values(analysisResults.dongData)
        .sort((a, b) => b.count - a.count);
    
    dongList.innerHTML = sortedDongs.map(dong => `
        <div class="dong-item" onclick="showDongApartments('${dong.name}')">
            <div class="dong-header">
                <span class="dong-name">[${dong.name}]</span>
                <span>🏢 ${dong.count}개 아파트</span>
            </div>
            <div class="dong-stats">
                🔍 ${dong.name} 커튼: ${formatRank(dong.ranking?.curtain)} | 
                ${dong.name} 블라인드: ${formatRank(dong.ranking?.blind)} | 
                📝 내 포스팅: ${dong.myPosts}개
            </div>
        </div>
    `).join('');
}

// 동별 아파트 표시
function showDongApartments(dongName) {
    currentDong = dongName;
    const dongData = analysisResults.dongData[dongName];
    
    document.getElementById('selectedDongName').textContent = `${dongName} 아파트 목록`;
    document.querySelector('.apartment-list').style.display = 'block';
    
    // 현재 동 하이라이트
    document.querySelectorAll('.dong-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent.includes(dongName)) {
            item.classList.add('active');
        }
    });
    
    sortApartments(currentSortType);
}

// 아파트 정렬
function sortApartments(type) {
    currentSortType = type;
    const dongData = analysisResults.dongData[currentDong];
    let apartments = [...dongData.apartments];
    
    // 정렬
    switch (type) {
        case 'price':
            apartments.sort((a, b) => (b.maxPrice || 0) - (a.maxPrice || 0));
            break;
        case 'households':
            apartments.sort((a, b) => (b.totalHouseholds || 0) - (a.totalHouseholds || 0));
            break;
        case 'trades':
            apartments.sort((a, b) => (b.recentTrades || 0) - (a.recentTrades || 0));
            break;
    }
    
    // 버튼 활성화
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(type === 'price' ? '가격' : type === 'households' ? '세대' : '거래')) {
            btn.classList.add('active');
        }
    });
    
    // 아파트 목록 표시
    const listDiv = document.getElementById('apartmentList');
    listDiv.innerHTML = apartments.map((apt, index) => {
        // 따옴표 문제 해결을 위해 데이터 속성 사용
        return `
        <div class="apartment-item" data-name="${apt.name}" data-dong="${apt.dong}" onclick="searchApartment(this)">
            <div class="apartment-name">
                🏠 ${apt.name}
            </div>
            <div class="apartment-info">
                <span class="info-badge">💰 ${apt.maxPrice || apt.avgPrice || 0}억</span>
                <span class="info-badge">📈 최근거래: ${apt.recentTrades || 0}건</span>
                <span class="info-badge">📅 전체거래: ${apt.totalTrades || 0}건</span>
            </div>
            <div class="blog-ranking">
                📊 ${apt.name} 커튼: ${formatRank(apt.ranking?.curtain)} | 
                ${apt.name} 블라인드: ${formatRank(apt.ranking?.blind)} | 
                📝 내 포스팅: ${apt.myPosts || 0}개
            </div>
        </div>
        `;
    }).join('');
}

// 순위 포맷팅
function formatRank(rank) {
    if (typeof rank === 'number') {
        return `${rank}위`;
    }
    return rank || '100위 밖';
}

// 진행 상황 업데이트
function updateProgress(message) {
    document.getElementById('progress').textContent = message;
}

// 딜레이
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// CSV 내보내기
function exportToCSV() {
    if (!analysisResults) return;
    
    let csv = '\ufeff'; // BOM for UTF-8
    csv += '동,아파트명,최고가(억),최근거래,전체거래,커튼순위,블라인드순위,내포스팅수\n';
    
    Object.values(analysisResults.dongData).forEach(dong => {
        dong.apartments.forEach(apt => {
            csv += `"${dong.name}","${apt.name}",${apt.maxPrice || 0},${apt.recentTrades || 0},${apt.totalTrades || 0},"${formatRank(apt.ranking?.curtain)}","${formatRank(apt.ranking?.blind)}",${apt.myPosts || 0}\n`;
        });
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `블로그분석_${selectedRegion}_${new Date().getTime()}.csv`);
    link.click();
}

// 아파트 검색 (네이버 지도)
function searchApartment(element) {
    const aptName = element.getAttribute('data-name');
    const dong = element.getAttribute('data-dong');
    const region = selectedRegion;
    
    // 네이버 지도 부동산 검색
    const searchQuery = encodeURIComponent(`${region} ${dong} ${aptName}`);
    const naverMapUrl = `https://map.naver.com/v5/search/${searchQuery}`;
    
    window.open(naverMapUrl, '_blank');
}
