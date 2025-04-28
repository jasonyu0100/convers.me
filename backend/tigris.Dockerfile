FROM tigrisdata/tigris-local:latest

EXPOSE 8081

ENV TIGRIS_SERVER_HTTP_PORT=8081
ENV TIGRIS_SERVER_DEFAULT_PROJECT=conversme
ENV TIGRIS_SERVER_INITIALIZE_SCHEMA=true

VOLUME /data

HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -O - http://localhost:8081/health || exit 1

CMD ["tigris-server", "--http.addr=0.0.0.0:8081", "--data.path=/data"]
