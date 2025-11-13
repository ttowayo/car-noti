// 전역 변수
let allWarnings = {};
let currentFilter = 'all';
let currentSearch = '';

// 데이터 로드
async function loadWarnings() {
    try {
        const response = await fetch('data/warnings.json');
        allWarnings = await response.json();
        displayWarnings();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        document.getElementById('warningsList').innerHTML = 
            '<div class="no-results">데이터를 불러올 수 없습니다.</div>';
    }
}

// 경고등 표시
function displayWarnings() {
    const warningsList = document.getElementById('warningsList');
    const noResults = document.getElementById('noResults');
    warningsList.innerHTML = '';

    let filteredWarnings = [];

    // 레벨 순서 정의 (4, 3, 2, 1 순서)
    const levelOrder = ['level4', 'level3', 'level2', 'level1'];
    
    // 전체보기일 때는 레벨 순서대로, 필터링일 때는 해당 레벨만
    const levelsToProcess = currentFilter === 'all' 
        ? levelOrder 
        : [currentFilter];

    // 레벨별로 경고등 수집
    levelsToProcess.forEach(level => {
        if (allWarnings[level]) {
            // 각 레벨의 경고등을 가나다 순으로 정렬
            const sortedWarnings = [...allWarnings[level]].sort((a, b) => {
                return a.name.localeCompare(b.name, 'ko');
            });

            sortedWarnings.forEach(warning => {
                // 검색어 필터링
                if (currentSearch === '' || warning.name.includes(currentSearch)) {
                    filteredWarnings.push({ ...warning, level: level });
                }
            });
        }
    });

    if (filteredWarnings.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    // 경고등 카드 생성
    filteredWarnings.forEach(warning => {
        const card = createWarningCard(warning);
        warningsList.appendChild(card);
    });
}

// 경고등 카드 생성
function createWarningCard(warning) {
    const card = document.createElement('div');
    card.className = `warning-card ${warning.level}`;

    // JSON에 저장된 이미지 경로 사용
    const imagePath = warning.image;

    card.innerHTML = `
        <img src="${imagePath}" alt="${warning.name}" class="warning-image" onerror="this.style.display='none'">
        <div class="warning-name">${warning.name}</div>
        <div class="warning-cause">
            <strong>발생원인:</strong> ${warning.cause}
        </div>
        <div class="warning-solution">
            <strong>대응방법:</strong> ${warning.solution}
        </div>
    `;

    return card;
}

// 필터 버튼 이벤트
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 활성 상태 변경
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 필터 적용
            currentFilter = btn.getAttribute('data-level');
            displayWarnings();
        });
    });
}

// 검색 기능
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // 검색 버튼 클릭
    searchBtn.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        displayWarnings();
    });

    // Enter 키 입력
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value.trim();
            displayWarnings();
        }
    });

    // 실시간 검색 (선택사항)
    searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value.trim();
        displayWarnings();
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadWarnings();
    setupFilterButtons();
    setupSearch();
});

