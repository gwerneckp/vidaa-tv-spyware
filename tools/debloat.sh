#!/bin/sh
# debloat.sh: run as root at boot (called from /APPS/.re/hearth-status-ctl.sh start).
# Removes services I don't want, without touching the read-only system:
#  - always-on services (tracking, log uploader, karaoke, Alexa, VIDAA voice/mic) are replaced by an idle
#    stand-in via bind mount, so the system watchdog sees them "running" and stops restarting them;
#  - Netflix and Prime Video background preloads are stopped as soon as they appear
#    (an app you open yourself is started differently and is left alone);
#  - the tracking service's user is firewalled from the internet as a second layer.
# Undo: delete the hook line in hearth-status-ctl.sh and reboot. Log: /tmp/debloat.log
BB=/usr/local/bin/busybox
D=/APPS/.re/debloat
STUB=$D/stub
exec >>/tmp/debloat.log 2>&1
echo "=== debloat $($BB date)"

for f in /usr/local/bin/HamService \
         /usr/local/bin/hi_logreport_service \
         /opt/karaoke/bin/karaoke \
         /opt/avsservice/bin/AlexaNativeAppService \
         /opt/avsservice/bin/voiceservice \
         /basic/bin/voicesdk_server; do
  [ -e "$f" ] || continue
  if $BB head -c 120 "$f" | $BB grep -q "debloat stand-in"; then echo "already stubbed $f"
  else mount --bind "$STUB" "$f" && echo "stubbed $f"; fi
done

for n in HamService hi_logreport_service karaoke AlexaNativeAppService voiceservice voicesdk_server; do
  for p in $($BB pidof $n); do
    $BB head -c 7 /proc/$p/cmdline 2>/dev/null | $BB grep -q '^/bin/sh' && continue   # already the stand-in
    kill -9 "$p" 2>/dev/null && echo "stopped real $n ($p)"
  done
done

# second layer: HamService's user (UhisHam, uid 329) may not reach the internet
if iptables -C OUTPUT -m owner --uid-owner 329 ! -d 127.0.0.0/8 -j REJECT 2>/dev/null; then
  echo "firewall: already in place"
else
  iptables -I OUTPUT 1 -m owner --uid-owner 329 ! -d 127.0.0.0/8 -j REJECT && echo "firewall: uid 329 outbound rejected"
fi

# preload watcher (one instance)
PIDF=/tmp/debloat-watch.pid
if [ -f $PIDF ] && kill -0 "$($BB cat $PIDF)" 2>/dev/null; then
  echo "preload watcher already running"
else
  $BB setsid sh -c '
    BB=/usr/local/bin/busybox
    while :; do
      for p in $($BB pidof ignition); do
        $BB grep -q -a -- "--launch-in-background" /proc/$p/cmdline 2>/dev/null && kill $p && echo "$($BB date) stopped Prime Video preload ($p)"
      done
      for p in $($BB pidof netflix); do
        $BB grep -q -a -- "--no-resources" /proc/$p/cmdline 2>/dev/null && kill $p && echo "$($BB date) stopped Netflix preload ($p)"
      done
      [ -z "$($BB pidof netflix)" ] && for p in $($BB pidof nfxdevsplash); do kill $p && echo "$($BB date) stopped Netflix splash ($p)"; done
      sleep 5
    done' >>/tmp/debloat.log 2>&1 < /dev/null &
  echo $! > $PIDF
  echo "preload watcher started ($!)"
fi
exit 0
