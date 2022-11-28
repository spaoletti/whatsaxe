REACT_APP_ENV=dev npm run-script build && \
firebase use dev && \
firebase deploy && \
curl -X PURGE https://whatsaxe-dev.web.app