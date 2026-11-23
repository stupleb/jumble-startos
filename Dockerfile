FROM --platform=$BUILDPLATFORM docker.io/library/node:24.22.1-alpine AS web

RUN apk add --no-cache git

ARG JUMBLE_VERSION=v26.11.2
ARG JUMBLE_COMMIT=55c7d26753fc2b0e5940cc462358016179b557e1
RUN git clone --branch ${JUMBLE_VERSION} --depth 1 https://github.com/CodyTseng/jumble.git /app \
    && test "$(git -C /app rev-parse HEAD)" = "${JUMBLE_COMMIT}"

WORKDIR /app
RUN npm ci --no-audit --no-fund
RUN VITE_LINK_PREVIEW_SERVER=/preview npm run build

FROM --platform=$BUILDPLATFORM docker.io/library/golang:1.27-alpine AS preview

ARG TARGETARCH
WORKDIR /src
COPY preview/go.mod preview/go.sum ./
RUN go mod download
COPY preview/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} go build -trimpath -ldflags='-s -w' -o /jumble-preview .

FROM docker.io/library/nginx:1.30-alpine

COPY --from=web /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=preview /jumble-preview /usr/local/bin/jumble-preview
