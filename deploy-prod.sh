REACT_APP_ENV=prod npm run-script build && \
firebase use default && \
firebase deploy && \
curl -X PURGE https://whatsaxe-78703.web.app