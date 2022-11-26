/**
 简介：
 使用它们能够很容易地实现重力感应、指南针、摇一摇等有趣的功能。
 1、deviceOrientaion
 封装了方向传感器数据的事件
 可以获取手机静止状态下的方向数据，例如手机所处角度、方位、朝向等

 2、deviceMotion
 封装了运动传感器数据的事件
 可以获取手机运动状态下的运动加速度等数据

 DeviceMotionEvent设备运动事件
 返回关于加速度和旋转的相关信息
 加速度的数据将包含三个轴：x,y,z
 因为部分设备没有硬件排除重力的影响，该事件会返回两个属性，accelerationIncludingGravity（含重力的加速度）和acceleration（加速度），后者 排除了重力的影响。
 */

+function () {
    'use strict';
    window.Shaking = function (callBack, options) {
        var default_option = {
            threshold: 100,  //触发的幅度
            ratio: 1,     //幅度系数
            speed_x: 0,
            speed_y: 0,
            speed_z: 0,     //XYZ各轴需要达到的最小加速度
            check_time: 100,    //检查的时间间隔
            time_out: 1000,     //限定的超时时间
            last_update: 0,    //最后时间记录
            forbid: 1000,  //是否禁止连续触发,禁止的持续时间
            count: 0  //限定时间内的触发次数
        }

        if (options && typeof options === "object") {
            for (var i in options) {
                if (default_option.hasOwnProperty(i)) {
                    default_option[i] = options[i];
                }
            }
        }

        var t = this;
        t.ots = default_option;

        t.turn = 1;
        t.timeClock = null;
        t.forbid_status = false;
        t.last_x = t.last_y = t.last_z = null;
        t.speedNP = {
            px: 0,
            nx: 0,
            py: 0,
            ny: 0,
            pz: 0,
            nz: 0
        }

        if (t.ots.check_time > t.ots.time_out) t.ots.check_time = t.ots.time_out;
        if (t.ots.ratio <= 0) t.ots.ratio = 1;

        t.deviceMotionHandler = function (eventData) {
            if (!t.forbid_status) {
                var x, y, z, acceleration, curTime, diffTime, speed, speedX, speedY, speedZ;
                acceleration = eventData.accelerationIncludingGravity;

                x = acceleration.x;
                y = acceleration.y;
                z = acceleration.z;

                /**
                 * 折回判断：
                 * 普通的运动单方向即可完成，摇一摇至少由两个相反方向的位移组成，如左右摇动，则有正值的x和负值的x至少各一个组成。
                 * 即时间间隔内，只要触发运动，则记录单轴正负2个加速度，2个速度各自达到或者绝对值相加达到才算摇晃运动
                 * */
                if (x > 0) t.speedNP.px = 1;
                else t.speedNP.nx = 1;
                if (y > 0) t.speedNP.py = 1;
                else t.speedNP.ny = 1;
                if (z > 0) t.speedNP.pz = 1;
                else t.speedNP.nz = 1;

                curTime = new Date().getTime();
                diffTime = curTime - t.ots.last_update;

                if (diffTime >= t.ots.check_time) {

                    t.ots.last_update = curTime;
                    speedX = Math.abs(x - t.last_x);
                    speedY = Math.abs(y - t.last_y);
                    speedZ = Math.abs(z - t.last_y);

                    t.turn = (t.speedNP.px + t.speedNP.nx + t.speedNP.py + t.speedNP.ny + t.speedNP.pz + t.speedNP.nz) || 1;

                    speed = (speedX + speedY + speedZ) * t.turn * t.ots.ratio;

                    if (speedX > t.ots.speed_x && speedY > t.ots.speed_y && speedZ > t.ots.speed_z && speed > t.ots.threshold && diffTime <= t.ots.time_out) {

                        if (t.ots.forbid) {
                            t.forbid_status = true;
                            t.timeClock = setTimeout(function () {
                                t.forbid_status = false;
                            }, t.ots.forbid);
                        }

                        if (typeof callBack === "function") callBack();

                    }

                    t.speedNP.px = t.speedNP.nx = t.speedNP.py = t.speedNP.ny = t.speedNP.pz = t.speedNP.nz = 0;

                    t.last_x = x;
                    t.last_y = y;
                    t.last_z = z;
                }
            }
        }

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', t.deviceMotionHandler, false);
        }
    }
}()