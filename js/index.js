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
const boardViews = new Map();
let nextViewNumber = 0;
let currentView;
let activeRequest = null;
let lastScrollY = 0;

const createBoardView = keyword => ({
    keyword,
    posts: [],
    cursor: null,
    isEnd: false,
    loaded: false,
    scrollY: 0,
});

const appendBoardItems = posts => {
    const boardList = document.querySelector('.boardList');
    const itemsHtml = posts
        .map(post => BoardItem(
            post.post_id,
            post.created_at,
            post.title,
            post.view_count,
            post.writer?.profile_image_url,
            post.writer?.nickname,
            post.comment_count,
            post.like_count,
        ))
        .join('');
    boardList.insertAdjacentHTML('beforeend', itemsHtml);
};

const loadBoardItems = async () => {
    if (activeRequest || currentView.isEnd) return;

    const request = new AbortController();
    activeRequest = request;
    const view = currentView;

    try {
        const result = await getPosts(view.cursor, ITEMS_PER_LOAD, view.keyword, request.signal);
        if (request.signal.aborted) return;
        if (!result.ok) {
            throw new Error('Failed to load post list.');
        }

        const posts = result.data?.posts ?? [];
        appendBoardItems(posts);
        view.posts.push(...posts);
        view.cursor = result.data?.next_cursor;
        view.isEnd = posts.length === 0 || !result.data?.has_next;
        view.loaded = true;
    } catch (error) {
        if (request.signal.aborted) return;
        console.error('Error fetching items:', error);
        view.isEnd = true;
    } finally {
        if (activeRequest === request) {
            activeRequest = null;
        }
    }
};

const showBoardView = view => {
    activeRequest?.abort();
    activeRequest = null;
    currentView = view;

    document.querySelector('#searchInput').value = view.keyword;
    document.querySelector('.boardList').replaceChildren();
    if (view.loaded) {
        appendBoardItems(view.posts);
    } else {
        view.isEnd = false;
        loadBoardItems();
    }

    window.scrollTo({ top: view.scrollY, behavior: 'instant' });
    lastScrollY = window.scrollY;
};

const openBoardView = (keyword, url) => {
    const boardViewId = performance.timeOrigin + ':' + nextViewNumber++;
    const state = { ...history.state, boardViewId };
    if (url) {
        history.pushState(state, '', url);
    } else {
        history.replaceState(state, '');
    }

    const view = createBoardView(keyword);
    boardViews.set(boardViewId, view);
    showBoardView(view);
};

const restoreBoardView = () => {
    const view = boardViews.get(history.state?.boardViewId);
    if (view) {
        showBoardView(view);
        return;
    }

    const keyword = new URL(window.location.href).searchParams.get('keyword')?.trim() ?? '';
    openBoardView(keyword.length >= 2 ? keyword : '');
};

const addSearchEvent = () => {
    const searchInput = document.querySelector('#searchInput');
    const searchButton = document.querySelector('.searchButton');
    if (!searchInput || !searchButton) return;

    const runSearch = () => {
        const trimmedKeyword = searchInput.value.trim();
        if (trimmedKeyword.length > 0 && trimmedKeyword.length < 2) {
            Dialog('검색 실패', '검색어는 2글자 이상 입력해주세요.');
            return;
        }
        if (trimmedKeyword === currentView.keyword) {
            const view = createBoardView(trimmedKeyword);
            boardViews.set(history.state.boardViewId, view);
            showBoardView(view);
            return;
        }

        currentView.scrollY = window.scrollY;
        const url = new URL(window.location.href);
        if (trimmedKeyword) {
            url.searchParams.set('keyword', trimmedKeyword);
        } else {
            url.searchParams.delete('keyword');
        }
        openBoardView(trimmedKeyword, url);
    };

    searchButton.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.isComposing) {
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
            const scrollY = window.scrollY;
            if (scrollY === lastScrollY) return;
            lastScrollY = scrollY;
            currentView.scrollY = scrollY;
            if (activeRequest || currentView.isEnd) return;

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

        // 목록을 그린 뒤 스크롤을 복원해야 하므로 브라우저의 자동 복원을 끈다.
        history.scrollRestoration = 'manual';
        restoreBoardView();
        window.addEventListener('popstate', () => {
            currentView.scrollY = window.scrollY;
            restoreBoardView();
        });

        addSearchEvent();
        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
