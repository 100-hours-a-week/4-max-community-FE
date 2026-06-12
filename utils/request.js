// function.js 에 저장된 전역 access token 변수 불러오기
import { globalAccessToken, serverSessionCheck } from './function.js';


export const parseJsonSafe = async response => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

const isAuthRequest = url => {
    const urlString = String(url);

    return (
        urlString.endsWith('/auth') ||
        urlString.includes('/auth/reissue') ||
        urlString.includes('/users/email/check') ||
        urlString.includes('/users/nickname/check')
    );
};

// 재시도를 했을 대 헤더에는 새로운 Access Token이 들어가야하므로
// 최신 Access Token을 붙이기 위한 함수
const createHeadersWithAccessToken = headers => {
    const newHeaders = {
        ...(headers || {}),
    };

    if (globalAccessToken) {
        newHeaders.Authorization = `Bearer ${globalAccessToken}`;
    }

    return newHeaders;
};

export const requestJson = async (url, options = {}) => {
    // 원본 옵션을 건드리지 않고 새 객체를 만드는것
    // 기본 요청 옵션을 유지하면서 Access Token만 추가함
    const requestOptions = {
        ...options,
        headers: createHeadersWithAccessToken(options.headers),
    };

    //요청을 보내고응답을 받아옴
    let response = await fetch(url, requestOptions);

    //응답 status가 401이고 인증이 필요한 url이 아니면며 이 if문 실행
    // 인증 API를 제외하는 이유는 reissue가 계쏙 반복될 수 있기 때문
    if (response.status === 401 && !isAuthRequest(url)) {
        const reissueResponse = await serverSessionCheck();

        if (reissueResponse.ok) {
            const retryOptions = {
                ...options,
                headers: createHeadersWithAccessToken(options.headers),
            };

            response = await fetch(url, retryOptions);
        } else {
            location.href = '/html/login.html';
        }
    }
    // 여기서 첫번째 요청이 성공했으면 첫번째 요청 응답
    // 만약 실패햇다면 재시도 요청에 대한 응답
    const body = await parseJsonSafe(response);

    return {
        response,
        ok: response.ok,
        status: response.status,
        code: body && body.code ? body.code : null,
        data: body && Object.prototype.hasOwnProperty.call(body, 'data')
            ? body.data
            : null,
        body,
    };
};
