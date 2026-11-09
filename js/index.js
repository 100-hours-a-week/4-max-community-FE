import BoardItem from '../component/board/boardItem.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import { requestJson } from '../utils/request.js';
import { authCheck, getServerUrl, prependChild, resolveImageUrl } from '../utils/function.js';
import { getPosts } from '../requests/indexRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const HTTP_NOT_AUTHORIZED = 401;
const SCROLL_THRESHOLD = 0.9;
const ITEMS_PER_LOAD = 5;
let currentKeyword = '';

let currentCursor = null;
let isEnd = false;
let activeRequest = null;

const setBoardItem = boardData => {
    const boardList = document.querySelector('.boardList');
    
    // 방어 코드 boardData뿐만 아니라 진짜 배열인 boardData.posts가 있는지 확인
    if (boardList && boardData && boardData.posts) {
        
        // 덩어리(boardData) 전체가 아니라 그 안의 배열(posts)을 꺼내서 map 돌리기
        // 백엔드에서 응답을 보낼 때 posts로 감싸서 보냈기 때문
        const itemsHtml = boardData.posts
            .map(data =>
                BoardItem(
                    data.post_id,         // 백엔드 DTO: @JsonProperty("post_id")
                    data.created_at,      // 백엔드 DTO: @JsonProperty("created_at")
                    data.title,           // 백엔드 DTO: title (일치)
                    data.view_count,      // 백엔드 DTO: @JsonProperty("view_count")
                    
                    //writer 객체 사용
                    data.writer ? data.writer.profile_image_url : null,
                    data.writer ? data.writer.nickname : null,      
                    
                    data.comment_count,   // 백엔드 DTO: @JsonProperty("comment_count")
                    data.like_count       // 백엔드 DTO: @JsonProperty("like_count")
                ),
            )
            .join('');
            
        boardList.innerHTML += ` ${itemsHtml}`;
    }
};

const resetBoardList = () => {
    const boardList = document.querySelector('.boardList');
    if (boardList) {
        boardList.innerHTML = '';
    }
};

const loadBoardItems = async ({ reset = false } = {}) => {
    if (!reset && (activeRequest || isEnd)) return;

    if (reset) {
        // 이전 검색 응답이 새 목록과 커서를 덮어쓰지 않도록 취소한다.
        activeRequest?.abort();
        currentCursor = null;
        isEnd = false;
        resetBoardList();
    }

    const request = new AbortController();
    activeRequest = request;

    try {
        const result = await getPosts(currentCursor, ITEMS_PER_LOAD, currentKeyword, request.signal);
        if (request.signal.aborted) return;
        if (!result.ok) {
            throw new Error('Failed to load post list.');
        }

        const data = result.data;
        if (!data?.posts?.length) {
            isEnd = true;
            return;
        }

        setBoardItem(data);
        currentCursor = data.next_cursor;
        isEnd = !data.has_next;
    } catch (error) {
        if (request.signal.aborted) return;
        console.error('Error fetching items:', error);
        isEnd = true;
    } finally {
        if (activeRequest === request) {
            activeRequest = null;
        }
    }
};

const addSearchEvent = () => {
    const searchInput = document.querySelector('#searchInput');
    const searchButton = document.querySelector('.searchButton');
    if (!searchInput || !searchButton) return;

    const runSearch = async () => {
        const trimmedKeyword = searchInput.value.trim();
        if (trimmedKeyword.length > 0 && trimmedKeyword.length < 2) {
            Dialog('검색 실패', '검색어는 2글자 이상 입력해주세요.');
            return;
        }
        currentKeyword = trimmedKeyword;
        await loadBoardItems({ reset: true });
    };

    searchButton.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            runSearch();
        }
    });
};

// 스크롤 이벤트 추가
const addInfinityScrollEvent = () => {
    window.addEventListener(
        'scroll',
        () => {
            if (activeRequest || isEnd) return;

            const hasScrolledToThreshold =
                window.scrollY + window.innerHeight >=
                document.documentElement.scrollHeight * SCROLL_THRESHOLD;

            if (hasScrolledToThreshold) {
                loadBoardItems();
            }
        },
        { passive: true },
    );
};

const init = async () => {
    try {
        const response = await authCheck();
        const data = await response.json();
        if (response.status === HTTP_NOT_AUTHORIZED) {
            window.location.href = '/html/login.html';
            return;
        }

        const userResponse = await requestJson(`${getServerUrl()}/users/me`, {
            method: 'GET',
            credentials: 'include',
        });

        const profileImageUrl = resolveImageUrl(
            userResponse.data.profile_image_url,
            DEFAULT_PROFILE_IMAGE,
        );

        prependChild(
            document.body,
            Header('Community', 0, profileImageUrl),
        );

        await loadBoardItems({ reset: true });

        addSearchEvent();
        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
