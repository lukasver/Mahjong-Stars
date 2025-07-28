To update cors:

```sh
gsutil cors set {fileLocation} gs://mjs-private-dev

# Check result
gsutil cors get gs://mjs-private-dev
## or with gcloud CLI
gcloud storage buckets update gs://mjs-private-dev --cors-file=CORS_CONFIG_FILE
```
