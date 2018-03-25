all: deploy

compile: clean
	npx tsc

deployplex: compile
	serverless deploy function -f plex

deploykodi: compile
	serverless deploy function -f kodi

deploy: compile
	serverless deploy

clean:
	rm -r dist
