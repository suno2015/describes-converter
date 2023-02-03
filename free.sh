# https://github.com/freefq/free
if [ -d $./free ];then
    git clone --depth=1 git@github.com:freefq/free.git
else
    cd free
    git pull
    cd ..
fi
mkdir build >& /dev/null
node ./dist/free.js -p ./free/v2 -t ./template.yaml >& ./build/free.yaml
