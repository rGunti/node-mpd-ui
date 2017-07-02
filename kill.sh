#!/usr/bin/env bash

echo "This script will shut down all processes of the run.sh script"
echo "to enable Development and Debugging."
echo ""
echo "The Web UI will be started, after the next reboot."
echo "You can keep the Web UI disabled by placing an empty file with the "
echo "following name in the boot drive:"
echo ""
echo "   /boot/no_npm_ui"
echo ""
echo "As long as this file is placed there the Web UI will not start and the"
echo "run.sh script will not work. To re-enable the Web UI on boot"
echo "remove this file from the boot drive."
echo ""

PID_WATCHDOG=$(ps aux | grep '[/]bin/bash /home/pi/node-mpd-ui/run.sh' | awk '{print $2}')
PID_SERVER=$(ps aux | grep '[n]ode ./bin/www' | awk '{print $2}')

echo "The following processes will be killed:"
echo " - UI Watchdog => $PID_WATCHDOG"
echo " - UI Server   => $PID_SERVER"
echo ""

read -r -p "Do you want to continue? [y/n] " response
case "$response" in
    [yY][eE][sS]|[yY])
        echo ""

        echo "Killing Watchdog (PID: $PID_WATCHDOG)"...
        sudo kill $PID_SERVER

        echo "Killing Server (PID: $PID_SERVER)"...
        sudo kill $PID_SERVER
        ;;
    *)
        echo ""
        ;;
esac

echo " ==== Script finished ==== "
