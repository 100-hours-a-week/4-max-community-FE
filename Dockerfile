FROM nginx:stable

WORKDIR /usr/share/nginx/html

# Nginx 기본 정적 파일 제거
RUN rm -rf /usr/share/nginx/html/*

# 커스텀 Nginx 설정 적용
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Nginx 설정 문법 검증
RUN nginx -t

# 서비스에 필요한 정적 파일만 복사
COPY component/ /usr/share/nginx/html/component/
COPY css/ /usr/share/nginx/html/css/
COPY html/ /usr/share/nginx/html/html/
COPY js/ /usr/share/nginx/html/js/
COPY public/ /usr/share/nginx/html/public/
COPY requests/ /usr/share/nginx/html/requests/
COPY utils/ /usr/share/nginx/html/utils/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]