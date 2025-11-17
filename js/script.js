// 전역 변수
let allWarnings = {};
let currentFilter = 'all';
let currentSearch = '';
let currentWarningIndex = 0; // 현재 표시 중인 경고등 인덱스
let currentWarningList = []; // 현재 필터링된 경고등 목록
const VALID_LEVELS = ['level4', 'level3', 'level2', 'level1'];
let enableUrlSync = false;
let suppressHashChange = false;
const initialRoute = extractRouteFromHash(window.location.hash);
let initialRouteApplied = false;
if (initialRoute?.level && VALID_LEVELS.includes(initialRoute.level)) {
    currentFilter = initialRoute.level;
}
// 레이어 팝업
const dimLayer = "<div id='dimLayer'></div>";

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
    
    // 전체보기일 때는 레벨 순서대로, 필터링일 때는 해당 레벨만
    const levelsToProcess = currentFilter === 'all' 
        ? VALID_LEVELS 
        : [currentFilter];

    // 레벨별로 경고등 수집
    levelsToProcess.forEach(level => {
        if (allWarnings[level]) {
            const warnings = allWarnings[level];

            warnings.forEach(warning => {
                // 검색어 필터링
                if (currentSearch === '' || warning.name.includes(currentSearch)) {
                    filteredWarnings.push({ ...warning, level: level });
                }
            });
        }
    });

    // 현재 필터링된 경고등 목록 저장
    currentWarningList = filteredWarnings;

    if (filteredWarnings.length === 0) {
        noResults.style.display = 'block';
        // 경고등이 없을 때는 계기판과 설명 섹션도 초기화
        updateDashboard(null);
        return;
    }

    noResults.style.display = 'none';

    // 경고등 카드 생성
    filteredWarnings.forEach(warning => {
        const card = createWarningCard(warning);
        warningsList.appendChild(card);
    });

    updateFilterButtonState();

    // 필터링된 첫 번째 경고등을 계기판에 표시
    currentWarningIndex = 0;
    updateDashboard(filteredWarnings[0]);
}

// 경고등 카드 생성
function createWarningCard(warning) {
    const card = document.createElement('a');
    card.className = `warning-card ${warning.level}`;
    card.href = 'javascript:void(0)'; // 앵커 기본 동작 방지

    // JSON에 저장된 이미지 경로 사용
    const imagePath = warning.image;

    card.innerHTML = `
        <img src="${imagePath}" alt="${warning.name}" class="warning-image" onerror="this.style.display='none'">
        <div class="warning-name">${warning.name}</div>
    `;

    // 카드 클릭 이벤트 추가
    card.addEventListener('click', (e) => {
        e.preventDefault();
        // 현재 경고등 목록에서 해당 경고등의 인덱스 찾기
        const index = currentWarningList.findIndex(w => 
            w.id === warning.id && w.level === warning.level && w.name === warning.name
        );
        if (index !== -1) {
            currentWarningIndex = index;
            updateDashboard(warning);
            // 스크롤 최상단으로 이동
            $('html, body').animate({ scrollTop: 0 }, 300);
        }
    });

    return card;
}

// 계기판 및 설명 섹션 업데이트
function updateDashboard(warning, suppressUrlUpdate = false) {
    if (!warning) {
        // 경고등이 없을 때 초기화 (검색 결과 없음)
        $(".dashboard-box .dashboard-img img").attr('src', 'img/ico-empty.png');
        $(".dashboard-box .dashboard-img img").attr('alt', '검색 결과 없음');
        $(".warning-info-section .warning-name").text('');
        $(".warning-info-section .warning-cause").html('<strong>원인 :</strong>');
        $(".warning-info-section .warning-solution").html('<strong>조치 :</strong>');
        $(".warning-info-section .warning-page-num").text('0/0');
        if (enableUrlSync && !suppressUrlUpdate) {
            updateUrl(null, null);
        }
        return;
    }

    // 경고등 이미지 업데이트
    $(".dashboard-box .dashboard-img img").attr('src', warning.image);
    $(".dashboard-box .dashboard-img img").attr('alt', warning.name);

    // 경고등 이름 업데이트
    $(".warning-info-section .warning-name").text(warning.name);

    // 원인 업데이트
    $(".warning-info-section .warning-cause").html('<strong>원인 :</strong> ' + warning.cause);

    // 조치 업데이트
    $(".warning-info-section .warning-solution").html('<strong>조치 :</strong> ' + warning.solution);

    // 페이지 번호 업데이트
    const currentPage = currentWarningIndex + 1;
    const totalPages = currentWarningList.length;
    $(".warning-info-section .warning-page-num").text(`${currentPage}/${totalPages}`);
    
    if (enableUrlSync && !suppressUrlUpdate) {
        updateUrl(warning.level, warning.id);
    }
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

// 이전/다음 버튼 이벤트
function setupNavigationButtons() {
    // 이전 버튼
    $(".warning-info-section .btn-info.prev").on('click', function() {
        if (currentWarningList.length === 0) return;
        
        // 클릭 효과: 버튼과 계기판 화살표에 'on' 클래스 추가
        $(this).addClass('on');
        $(".dashboard-box .dashboard-turn .ico-prev").addClass('on');
        
        // 이전 인덱스로 이동 (순환: 첫 번째에서 마지막으로)
        currentWarningIndex = (currentWarningIndex - 1 + currentWarningList.length) % currentWarningList.length;
        updateDashboard(currentWarningList[currentWarningIndex]);
        
        // 짧은 시간 후 'on' 클래스 제거
        setTimeout(function() {
            $(".warning-info-section .btn-info.prev").removeClass('on');
            $(".dashboard-box .dashboard-turn .ico-prev").removeClass('on');
        }, 300);
    });

    // 다음 버튼
    $(".warning-info-section .btn-info.next").on('click', function() {
        if (currentWarningList.length === 0) return;
        
        // 클릭 효과: 버튼과 계기판 화살표에 'on' 클래스 추가
        $(this).addClass('on');
        $(".dashboard-box .dashboard-turn .ico-next").addClass('on');
        
        // 다음 인덱스로 이동 (순환: 마지막에서 첫 번째로)
        currentWarningIndex = (currentWarningIndex + 1) % currentWarningList.length;
        updateDashboard(currentWarningList[currentWarningIndex]);
        
        // 짧은 시간 후 'on' 클래스 제거
        setTimeout(function() {
            $(".warning-info-section .btn-info.next").removeClass('on');
            $(".dashboard-box .dashboard-turn .ico-next").removeClass('on');
        }, 300);
    });
}

// 위로 가기 버튼 기능
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    // 스크롤 이벤트: 스크롤 위치에 따라 버튼 표시/숨김
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });
    
    // 버튼 클릭 시 최상단으로 스크롤
    scrollToTopBtn.addEventListener('click', () => {
        $('html, body').animate({ scrollTop: 0 }, 300);
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await loadWarnings();
        applyInitialRoute();
        enableUrlSync = true;
        syncUrlWithCurrentWarning();
    })();
    setupFilterButtons();
    setupSearch();
    setupNavigationButtons();
    setupScrollToTop();
    window.addEventListener('hashchange', handleHashChange);
});
  
// 레이어 팝업 열고 닫기
function togglePopup(id) {
  // 팝업 열고 닫기	togglePopup(#id)
  // 팝업 창 전환	togglePopup(#current_id, #open_id)
  if (arguments.length < 2) {
    if ($(id).is(":visible")) {
      $(id).fadeOut("fast").removeClass("on");
      $("#dimLayer").fadeOut("fast", function () {
        $("#dimLayer").remove();
        $("body").css("overflow", "auto");
      });
    } else {
      $("body").append(dimLayer);
      $("body").css("overflow", "hidden");
      $(id).fadeIn("fast").addClass("on");
    }
  } else {
    var pop1 = arguments[0];
    var pop2 = arguments[1];

    if ($(pop1).is(":visible")) {
      $(pop1).fadeOut("fast").removeClass("on");
      $(pop2).fadeIn("fast").addClass("on");
    }
  }
}

$(function (){

    $('body').on('click', '#dimLayer', function() {
        $('.popup-layer').fadeOut("fast").removeClass("on");
        $('#dimLayer').remove();   
        $("body").css("overflow", "auto");
    });
});

function updateFilterButtonState() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) return;
    filterButtons.forEach(btn => {
        const level = btn.getAttribute('data-level');
        if (level === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function extractRouteFromHash(hash) {
    if (!hash) return null;
    const normalizedHash = hash.replace(/^#/, '');
    const match = normalizedHash.match(/^(level[1-4])\/(\d+)$/);
    if (!match) return null;
    return {
        level: match[1],
        id: parseInt(match[2], 10)
    };
}

function updateUrl(level, id) {
    const targetHash = level && id ? `#${level}/${id}` : '';
    if (window.location.hash === targetHash) return;
    if (targetHash) {
        suppressHashChange = true;
        window.location.hash = targetHash;
    } else {
        if (window.location.hash) {
            suppressHashChange = true;
            history.replaceState(null, '', window.location.pathname + window.location.search);
            suppressHashChange = false;
        }
    }
}

function selectWarningById(level, id) {
    if (!level || !id) return false;
    const index = currentWarningList.findIndex(w => 
        w.level === level && Number(w.id) === Number(id)
    );
    if (index === -1) {
        return false;
    }
    currentWarningIndex = index;
    updateDashboard(currentWarningList[index], true);
    return true;
}

function applyInitialRoute() {
    if (initialRouteApplied) return;
    initialRouteApplied = true;
    if (!initialRoute || !initialRoute.level) return;
    const applied = selectWarningById(initialRoute.level, initialRoute.id);
    if (!applied && currentWarningList.length > 0) {
        currentWarningIndex = 0;
        updateDashboard(currentWarningList[0], true);
    }
}

function syncUrlWithCurrentWarning() {
    if (!currentWarningList.length || !currentWarningList[currentWarningIndex]) {
        updateUrl(null, null);
        return;
    }
    const warning = currentWarningList[currentWarningIndex];
    updateUrl(warning.level, warning.id);
}

function handleHashChange() {
    if (!enableUrlSync) return;
    if (suppressHashChange) {
        suppressHashChange = false;
        return;
    }
    const route = extractRouteFromHash(window.location.hash);
    if (!route || !route.level) {
        currentFilter = 'all';
        displayWarnings();
        return;
    }

    if (route.level !== currentFilter) {
        currentFilter = route.level;
        displayWarnings();
        return;
    }

    const selected = selectWarningById(route.level, route.id);
    if (!selected && currentWarningList.length) {
        currentWarningIndex = 0;
        updateDashboard(currentWarningList[0], true);
    }
}

