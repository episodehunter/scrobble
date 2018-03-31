all: deploy

compile:
	npx tsc
	cp package-lock.json env.yml package.json dist
	cp _serverless.yml dist/serverless.yml
	cd dist; npm install --production

deployplex: compile
	cd dist; serverless deploy function -f plex

deploykodi: compile
	cd dist; serverless deploy function -f kodi

deploy: compile
	cd dist; serverless deploy

package: compile
	cd dist; serverless package

clean:
	rm -r dist
