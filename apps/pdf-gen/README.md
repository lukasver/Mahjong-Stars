# pdf-gen

To install dependencies:

```
docker buildx build --progress=plain -t pdf-gen -f ./Dockerfile.pdf-gen --build-arg PROJECT="@mjs/pdf-gen" --build-arg CI=false .
```

```
docker run -d --name pdf-generator -p 8080:8080 pdf-gen
```

Build for linux platform

```
docker build -t europe-west3-docker.pkg.dev/mahjongstars-466909/mjs/pdf-gen:stage -f ./Dockerfile.pdf-gen . --platform linux/amd64 --build-arg PROJECT=@mjs/pdf-gen --build-arg HOSTNAME=0.0.0.0 --build-arg PORT=8080
```
