#
# This builds an OpenWrt package
# (VoCore, Onion Omega, Carambola, WRTnode, TL-MR3020 ...)
#

.PHONY: clean

all: blynk-library-js.ipk

blynk-library-js.ipk:
	rm -rf ipk
	mkdir -p ipk/usr/local/lib/node_modules/blynk-library
	cp -r *.js *.json certs bin examples ipk/usr/local/lib/node_modules/blynk-library
	mkdir -p ipk/bin
	cp -s /usr/local/lib/node_modules/blynk-library/bin/*.js ipk/bin/
	tar czvf control.tar.gz control
	cd ipk; tar czvf ../data.tar.gz .; cd ..
	echo 2.0 > debian-binary
	ar r blynk-library-js.ipk control.tar.gz data.tar.gz  debian-binary

clean:
	rm -rf ipk
	rm -f control.tar.gz data.tar.gz debian-binary
	rm -f blynk-library-js.ipk
