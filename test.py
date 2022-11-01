from flask import Flask, json, request
from pyaxidraw import axidraw   # import module
from flask_cors import CORS

ad = axidraw.AxiDraw()          # Initialize class

api = Flask(__name__)
CORS(api)




@api.route('/connect', methods=['POST'])
def post_connect():

    ad.interactive()                # Enter interactive context
    if not ad.connect():            # Open serial port to AxiDraw;
        return json.dumps({"success": False}), 201

    ad.options.units = 2            # set working units to mm.
    ad.update()


    return json.dumps({"success": True}), 201


@api.route('/move', methods=['POST'])
def move():
    pt = request.data.decode().split(",")
    x = float(pt[0])
    y = float(pt[1])
    print("moveto", x, y)
    ad.moveto(x, y)

    return json.dumps({"success": True}), 201


@api.route('/line', methods=['POST'])
def line():
    pt = request.data.decode().split(",")
    x = float(pt[0])
    y = float(pt[1])
    print("lineto", x, y)
    ad.lineto(x, y)

    return json.dumps({"success": True}), 201


@api.route('/disconnect', methods=['POST'])
def post_disconnect():
    if ad.connected:
        ad.disconnect()

    ad.plot_setup()
    ad.options.mode = "manual"
    ad.options.manual_cmd = "raise_pen"
    ad.options.pen_rate_raise = 70
    ad.options.pen_pos_up = 100
    ad.plot_run()

    ad.plot_setup()
    ad.options.mode = "manual"
    ad.options.manual_cmd = "disable_xy"
    ad.plot_run()

    return json.dumps({"success": True}), 200


if __name__ == '__main__':
    api.run()

    # print(request.form)
    ad.disconnect()

    ad.plot_setup()
    ad.options.mode = "manual"
    ad.options.manual_cmd = "enable_xy"
    ad.plot_run()
