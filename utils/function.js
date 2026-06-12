export const getServerUrl = () => {
    const configUrl =
        typeof window !== 'undefined' &&
        window.__APP_CONFIG__ &&
        window.__APP_CONFIG__.API_BASE_URL
            ? String(window.__APP_CONFIG__.API_BASE_URL).trim()
            : '';

    if (configUrl) {
        return configUrl.replace(/\/+$/, '');
    }

    const host = window.location.hostname;
    // host가 localhost면 localhost:8080 반환
    // host가 
    return host.includes('localhost') || host === '127.0.0.1'
        ? 'http://localhost:8080'
        // /api로 프론트와 백엔드를 nginx에서 분기처리하기 위해
        : '/api';
};

export const resolveImageUrl = (url, fallback = null) => {
    if (!url) return fallback;
    if (/^https?:\/\//i.test(url)) return url;
    return `${getServerUrl()}${url}`;
};
// 프론트엔드 메모리에 Access Token을 담아둘 전역 변수 설정
export let globalAccessToken = null;

export const serverSessionCheck = async () => {
    // 페이지 이동이나 새로고침 시 이 함수가 실행
    // 브라우저가 가진 Refresh Token 쿠키를 백엔드 /auth/reissue 로 보내서 재발급
    // 근데 매번 재발급을 해도 괜찮을지..?
    const res = await fetch(`${getServerUrl()}/auth/reissue`, {
        method: 'POST', // 재발급 API 메서드에 맞춤
        credentials: 'include', // HttpOnly 쿠키 전송 필수 옵션
    });

    if (res.ok) {
        //cloon() -> .json으로 꺼내서 읽으면 증발해버림 
        // 즉 토큰을 빼고 다시 한번 res객체를 받아다가 또 꺼내려고 하다가 body stream alreat read 에러가 뜸
        // 따라서 응답을 복제하면서 에러 해결
        const json = await res.clone().json();
        // 백엔드 ApiResponse에서 새로 발급된 accessToken을 꺼내서 메모리에 저장
        globalAccessToken = json.data.access_token; 
        console.log("Access Token 재발급 및 메모리 저장");
    } else {
        // 만약 쿠키가 만료됐거나 이상하면 메모리 비우기
        globalAccessToken = null;
    }

    return res;
};
// 로그인된 유저만 접근 가능한 페이지에서 호출함
export const authCheck = async () => {
    const response = await serverSessionCheck();
    // 재발급(인증)에 실패하면 로그인 페이지로 이동
    if (!response || !response.ok) {
        location.href = '/html/login.html';
    }
    return response;
};

export const clearAccessToken = () => {
    globalAccessToken = null;
};

// 비로그인 유저만 접근 가능한 페이지에서 호출 로그인이나 회원가입
export const authCheckReverse = async () => {
    const response = await serverSessionCheck();
    // 이미 쿠키가 있어서 재발급에 성공했다면(로그인 상태라면) 메인 페이지로 이동
    if (response && response.ok) {
        location.href = '/html/index.html'; // /html/index.html 로 이동
    }
};
// 이메일 유효성 검사
export const validEmail = email => {
    const REGEX =
        /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    return REGEX.test(email);
};

export const validPassword = password => {
    const REGEX =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return REGEX.test(password);
};

export const validNickname = nickname => {
    const REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;
    return REGEX.test(nickname);
};

export const prependChild = (parent, child) => {
    parent.insertBefore(child, parent.firstChild);
};

/**
 *
 * @param {File} file  이미지 파일
 * @param {boolean} isHigh? : true면 origin, false면  1/4 사이즈
 * @returns
 */
export const fileToBase64 = (file, isHigh) => {
    return new Promise((resolve, reject) => {
        const size = isHigh ? 1 : 4;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const width = img.width / size;
                const height = img.height / size;
                const elem = document.createElement('canvas');
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.canvas.toDataURL());
            };
            img.onerror = e => {
                reject(e);
            };
        };
        reader.onerror = e => {
            reject(e);
        };
    });
};

/**
 *
 * @param {string} param
 * @returns
 */
export const getQueryString = param => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
};

export const padTo2Digits = number => {
    return number.toString().padStart(2, '0');
};
