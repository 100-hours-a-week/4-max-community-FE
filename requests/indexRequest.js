import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

// cusor와 size로 파라미터 변경
export const getPosts = (cursor = null, size = 10) => {
    // URLSearchParams를 사용해 파라미터를 조립
    // 쿼리 스트링을 쉽게 생성, 수정해주는 객체
    const query = new URLSearchParams();
    
    // cursor가 존재할 때만(추가 스크롤 시) 파라미터에 포함
    if (cursor) {
        query.append('cursor', cursor);
    }
    query.append('size', size); // size는 항상 포함

    const result = requestJson(
        `${getServerUrl()}/posts?${query.toString()}`,
        {
            credentials: 'include',
        },
    );
    return result;
};

export const searchPosts = (keyword, offset = 0, limit = 5, sort = 'recent') => {
    const query = new URLSearchParams({
        keyword,
        offset,
        limit,
        sort,
    });
    const result = requestJson(
        `${getServerUrl()}/v1/posts/search?${query.toString()}`,
        {
            credentials: 'include',
        },
    );
    return result;
};
