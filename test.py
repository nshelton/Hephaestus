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

    # ad.moveto(22.656702041625977, 32.03443908691406)
    # ad.lineto(20.483348846435547, 27.533226013183594)
    # ad.lineto(20.483348846435547, 26.81220817565918)
    # ad.lineto(21.32796859741211, 26.81220817565918)
    # ad.lineto(21.32796859741211, 27.533226013183594)
    # ad.lineto(22.105636596679688, 31.488525390625)
    # ad.moveto(28.02313804626465, 29.660226821899414)
    # ad.lineto(26.019737243652344, 31.498825073242188)
    # ad.lineto(25.81888198852539, 32.20954132080078)
    # ad.lineto(24.11933708190918, 27.466272354125977)
    # ad.moveto(40.77033996582031, 102.78779602050781)
    # ad.lineto(38.99110412597656, 99.10283660888672)
    # ad.lineto(38.99110412597656, 98.51256561279297)
    # ad.lineto(39.682559967041016, 98.51256561279297)
    # ad.lineto(39.682559967041016, 99.10283660888672)
    # ad.lineto(40.31920623779297, 102.34088134765625)
    # ad.moveto(45.16362380981445, 100.84412384033203)
    # ad.lineto(43.523521423339844, 102.34931182861328)
    # ad.lineto(43.35908889770508, 102.93114471435547)
    # ad.lineto(41.96773910522461, 99.04801940917969)

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
