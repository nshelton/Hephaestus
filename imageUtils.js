imageUtils = function () {

    pathUtils = new PathUtils()
    
    this.downsample = function (bitmap, w, h) {
        result = []
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                if (grayscale[x + y * w] < 100) {
                    paths.push([[x,y], [x,y+1]])

                }
            }
        }
        result
    }

    this.trageImage = function (bitmap, w, h) {
        paths = []

        console.log(bitmap)

        grayscale = []
        if (grayscale.length % 4 != 0) {
            alert("invalid image")
            return
        }
        for (var i = 0; i < bitmap.length; i += 4) {

            val = bitmap[i] + bitmap[i + 1] + bitmap[i + 2]
            val *= bitmap[i + 3] / 255 
            grayscale.push(val / 3)
        }

        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                if (grayscale[x + y * w] < 200) {
                    paths.push([[x,y], [x,y+1]])

                }
            }
        }

        paths = this.collapsePaths(paths)

        var scale = 50
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        // tx = 3000
        // ty = 3000
        // paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        console.log(paths)
        return paths
    }


    this.collapsePaths = function(pathList) {
        newPaths = []

        newPaths.push(pathList[0])

        function length(p0, p1) {
            dx = p0[0] - p1[0]
            dy = p0[1] - p1[1]
            return Math.sqrt(dx*dx + dy*dy)
        }

        for(var i = 1; i < pathList.length; i ++) {
            var lastPath = newPaths[newPaths.length-1]

            if ( length(lastPath[lastPath.length-1], pathList[i][0]) < 0.1) {
                newPaths[newPaths.length-1] = lastPath.concat(pathList[i].slice(1))

            } else {
                newPaths.push(pathList[i])
            }
        }

        return newPaths
    }


}
