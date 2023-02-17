
imageUtils = function () {

    pathUtils = new PathUtils()

    this.downsample = function (bitmap, w, h) {
        result = []
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                if (grayscale[x + y * w] < 100) {
                    paths.push([[x, y], [x, y + 1]])

                }
            }
        }
        result
    }


    this.dither = function (bitmap, w, h) {

        function shuffle(array) {
            let currentIndex = array.length,  randomIndex;
          
            // While there remain elements to shuffle.
            while (currentIndex != 0) {
          
              // Pick a remaining element.
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex--;
          
              // And swap it with the current element.
              [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
            }
          
            return array;
          }

          
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

        function getPixel(p) {
            return grayscale[(Math.round(p[0]) + Math.round(p[1]) * w)]
        }

        points = []
        regular = []

        nPoints = 10000

        while(points.length < nPoints){
            var x = Math.random() * w
            var y = Math.random() * h
           
            var brightness = getPixel([x,y])/255
            if (Math.random() >= brightness ) {
                points.push([x, y]);
            }
        }
        const xStep = 16
        const yStep = 16

        for(var i = xStep / 2; i < width; i+=xStep){
            for(var j = yStep / 2; j < width; j+=yStep){
                regular.push([i, j]);
            }
        }
        
        var rejectionSites = sites.slice();
        originalRejection = sites.slice();


        // for (var x = 0; x < w; x ++ ) {
        //     for (var y = 0; y < h; y ++ ) {
        //         if (getPixel([x,y]) < Math.random() * 256) {
        //             points.push([x, y])
        //         }
        //     }
        // }

        // points = shuffle(points)
        // points = points.slice(0, nPoints)

        // function dist(a, b) {
        //     return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]))
        // }

        // function dir(a, b) {
        //     d = dist(a, b)
        //     return [(a[0] - b[0]) / d, (a[1] - b[1]) / d]
        // }

        // function relax(points) {
        //     for (var i = 0; i < nPoints; i++) {
        //         for (var j = 0; j < nPoints; j++) {
        //             if (i != j) {
        //                 d = dist(points[i], points[j])
        //                 thresh = getPixel(points[i])
        //                 repulsion = thresh 
        //                 if (d < thresh) {
        //                     n = dir(points[i], points[j]) 
        //                     points[j][0] -= n[0] / (0.001 + d )
        //                     points[j][1] -= n[1] / (0.001 + d )
        //                 }
        //             }
        //         }
        //     }
        //     return points
        // }

        // for (var i = 0; i < 20; i++) {
        //     points = relax(points)
        // }

        paths = points.map(p => pathUtils.circlePath(p[0], p[1], 0.5, 10))


        var scale = 50
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        // tx = 3000
        // ty = 3000
        // paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
        console.log(paths)
        return paths
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
                if (grayscale[x + y * w] < 80) {
                    paths.push([[x, y], [x, y + 1]])

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


    this.collapsePaths = function (pathList) {
        newPaths = []

        newPaths.push(pathList[0])

        function length(p0, p1) {
            dx = p0[0] - p1[0]
            dy = p0[1] - p1[1]
            return Math.sqrt(dx * dx + dy * dy)
        }

        for (var i = 1; i < pathList.length; i++) {
            var lastPath = newPaths[newPaths.length - 1]

            if (length(lastPath[lastPath.length - 1], pathList[i][0]) < 0.1) {
                newPaths[newPaths.length - 1] = lastPath.concat(pathList[i].slice(1))

            } else {
                newPaths.push(pathList[i])
            }
        }

        return newPaths
    }


}
