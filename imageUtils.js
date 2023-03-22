imageUtils = function () {

    this.createImage = function () {
        img = []
        w = 100
        h = 100
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                u = y / h - 0.5
                v = x / w - 0.5
                t = Math.sin(50 * (u * u + v * v) + 15) * 0.5 + 0.5

                t = Math.pow(t, 0.2)

                img.push(t * 255)
                img.push(t * 255)
                img.push(t * 255)
                img.push(t * 255)
            }
        }
        return {
            data: img,
            width: w,
            height: h
        }
    }

    pathUtils = new PathUtils()

    this.lines = function (imgElement) {
        console.log(imgElement)
        let mat = cv.imread(imgElement);
        console.log(mat)
        rho = 1  // distance resolution in pixels of the Hough grid
        theta = Math.PI / 180  // angular resolution in radians of the Hough grid
        threshold = 15  // minimum number of votes (intersections in Hough grid cell)
        min_line_length = 50  // minimum number of pixels making up a line
        max_line_gap = 20  // maximum gap in pixels between connectable line segments

        lines = cv2.HoughLinesP(mat, rho, theta, threshold, [],
            min_line_length, max_line_gap)


        console.log(lines)
        return []
    }

    this.downsample = function (bitmap, w, h) {
        result = []
        for (var x = 0; x < w; x += 2) {
            for (var y = 0; y < h; y += 2) {
                val = bitmap[x + y * w] + bitmap[(x + 1) + y * w]
                val += bitmap[x + (y + 1) * w] + bitmap[(x + 1) + (y + 1) * w]
                result[x / 2 + y / 2 * w / 2] = val / 4
            }
        }
        return result
    }
    this.hatch = function (bitmap, w, h, optomizer) {
        console.log(w, h)
        function shuffle(array) {
            let currentIndex = array.length, randomIndex;

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



        function rbg2cmyk(r, g, b) {
            /* calculate complementary colors */
            c = 255 - r;
            m = 255 - g;
            y = 255 - b;
            /* find the black level k */
            K = Math.min(c, m, y)
            /* correct complementary color lever based on k */
            C = c - K
            M = m - K
            Y = y - K

            return [c, m, y, K]
        }
        function luma(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b }
        grayscale = []



        for (var i = 0; i < bitmap.length; i += 4) {
            // val = bitmap[i] + bitmap[i + 1] + bitmap[i + 2]
            val = luma(bitmap[i], bitmap[i + 1], bitmap[i + 2])
            grayscale.push(val)
        }

        console.log(w, h)

        grayscale = this.downsample(grayscale, w, h)

        w /= 2
        h /= 2

        function getPixel(p) {
            return grayscale[(Math.round(p[0]) + Math.round(p[1]) * w)]
        }
        console.log(w, h)

        bands = 50
        paths = [[], [], [], []]
        skip = 1

        for (var x = 0; x < w; x += skip) {
            console.log(x / w)
            for (var y = 0; y < h; y += skip) {
                let px = getPixel([x, y])

                if (px < bands * 1) {
                    paths[0].push([[x, y], [x + skip, y + skip]])
                }
                if (px < bands * 2) {
                    paths[1].push([[x + skip, y], [x, y + skip]])
                }
                if (px < bands * 3) {
                    paths[2].push([[x, y], [x + skip, y]])
                }
                if (px < bands * 4) {
                    paths[3].push([[x, y], [x, y + skip]])
                }
            }
        }
        console.log(paths)
        paths = paths.map(p => optomizer.optomizeKD(p)).flat(1)
        // paths = paths.flat(1)

        paths = pathUtils.transform(paths, 0.3, 0, 0)

        // paths = shuffle(paths)
        // paths = paths.splice(0, paths.length - 1000)
        // paths
        return paths

    }

    this.dither = function (bitmap, w, h) {
        function getCentroid(cell) {
            const pts = getOutline(cell)
            var first = pts[0], last = pts[pts.length - 1];
            if (first.x != last.x || first.y != last.y) pts.push(first);
            var twicearea = 0, x = 0, y = 0, nPts = pts.length, p1, p2, f;
            for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
                p1 = pts[i]; p2 = pts[j];
                f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
                twicearea += f;
                x += (p1.x + p2.x - 2 * first.x) * f;
                y += (p1.y + p2.y - 2 * first.y) * f;
            }
            f = twicearea * 3;
            return { x: x / f + first.x, y: y / f + first.y };
        }

        function uniquePoints(value, index, array) { return array.findIndex(v => v.x == value.x && v.y == value.y) === index; }
        function mul(a, b) { return { x: a.x * b, y: a.y * b } }
        function add(a, b) { return { x: a.x + b.x, y: a.y + b.y } }
        function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } }
        function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y } }
        function length(a) { return Math.sqrt(a.x * a.x + a.y * a.y) }
        function sqDistance(a, b) { return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) }
        function getAngle(a, b) { return Math.atan2((a.x - b.x), (a.y - b.y)) }

        function getOutline(cell, inset = 0) {
            verts = cell.halfedges.map(he => [he.edge.va, he.edge.vb]).flat(2)
            verts = verts.filter(uniquePoints);
            center = verts.reduce(add, { x: 0, y: 0 })
            center = mul(center, 1 / verts.length)
            pointsAndAngles = verts.map(p => { return { point: p, angle: getAngle(p, center) } })
            sorted = pointsAndAngles.sort((a, b) => a.angle - b.angle).map(e => e.point)
            sorted.push(sorted[0])
            if (inset > 0) {
                sorted = sorted.map(p => lerp(p, center, inset))
            }
            return sorted
        }

        function shuffle(array) {
            let currentIndex = array.length, randomIndex;

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


        function getPixel(p) {
            return grayscale[(Math.round(p[0]) + Math.round(p[1]) * w)]
        }
        function rbg2cmyk(r, g, b) {
            /* calculate complementary colors */
            c = 255 - r;
            m = 255 - g;
            y = 255 - b;
            /* find the black level k */
            K = Math.min(c, m, y)
            /* correct complementary color lever based on k */
            C = c - K
            M = m - K
            Y = y - K

            return [c, m, y, K]
        }
        function luma(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b }

        grayscale = []

        for (var i = 0; i < bitmap.length; i += 4) {

            val = bitmap[i] + bitmap[i + 1] + bitmap[i + 2]

            cmyk = rbg2cmyk(bitmap[i], bitmap[i + 1], bitmap[i + 2])
            // specific channels
            // val = bitmap[i + 2] * 3
            val = luma(bitmap[i], bitmap[i + 1], bitmap[i + 2])
            // val = 255 - cmyk[2]
            // val *= bitmap[i + 3]  

            grayscale.push(val)
        }

        if (grayscale.length % 4 != 0) {
            alert("invalid image")
            return
        }

        points = []

        const nPoints = 2000

        while (points.length < nPoints) {
            var x = Math.random() * w
            var y = Math.random() * h

            var brightness = getPixel([x, y]) / 255
            if (Math.random() >= brightness) {
                points.push({ x: x, y: y });
            }
        }

        function getBbox(pts) {
            pad = 10
            minX = 1e10
            maxX = -1e10
            minY = 1e10
            maxY = -1e10

            pts.forEach(p => {
                minX = Math.min(p.x, minX)
                maxX = Math.max(p.x, maxX)
                minY = Math.min(p.y, minY)
                maxY = Math.max(p.y, maxY)
            })

            return { xl: minX - pad, xr: maxX + pad, yt: minY - pad, yb: maxY + pad }

        }

        paths = []

        function getWeightedCentroids(points) {
            var tree = new kdTree(points, sqDistance, ["x", "y"]);

            weightedSums = points.map(p => ({ x: p.x, y: p.y }))
            numPixels = points.map(p => 1)

            var lastIdx = 0
            for (var x = 0; x < w; x++) {
                for (var y = 0; y < h; y++) {

                    var brightness = 255 - grayscale[x + y * w]

                    // brightness = Math.pow(brightness, )
                    point = { x: x + 0.5, y: y + 0.5 }
                    const near = tree.nearest(point, 1)[0][0]

                    var idx = lastIdx
                    if (!(points[lastIdx].x == near.x && points[lastIdx].y == near.y)) {
                        idx = lastIdx
                    } else {
                        idx = points.findIndex(p => {
                            return p.x == near.x && p.y == near.y
                        })
                    }

                    weightedSums[idx] = add(weightedSums[idx], mul(point, brightness))
                    // weightedSums[idx] = add(weightedSums[idx], point)
                    numPixels[idx] += brightness
                }
            }
            return weightedSums.map((e, i) => mul(e, 1 / numPixels[i]))
        }

        voronoi = new Voronoi()
        // relax
        const iterations = 25
        for (var ii = 0; ii < iterations; ii++) {
            console.log(ii)
            bbox = getBbox(points)
            // if (ii <10) {
            if (ii % 5 == 0) {
                diagram = voronoi.compute(points, bbox);
                points = diagram.cells.map((cell) => ({ x: cell.site.x, y: cell.site.y }))
                centroids = diagram.cells.map(cell => getCentroid(cell));
            } else {
                centroids = getWeightedCentroids(points);
            }

            for (var j = 0; j < points.length; j++) {
                dir = sub(centroids[j], points[j])
                const l = length(dir)

                // dir = mul(dir, 1 / (l + 0.0001))
                dir = mul(dir, 0.5)
                points[j] = add(points[j], dir)
                // points[j] = add(points[j], { x: Math.random(), y: Math.random() })
            }

            points = points.map(p => ({ x: Math.max(0, p.x), y: Math.max(0, p.y) }))
            points = points.map(p => ({ x: Math.min(w, p.x), y: Math.min(h, p.y) }))
        }

        bbox = getBbox(points)
        diagram = voronoi.compute(points, bbox);

        // paths = paths.concat(
        //     diagram.cells.map(cell => {
        //         return getOutline(cell, 0.1).map(p => [p.x, p.y])
        //     })
        // )

        // voronoi
        // diagram.edges.forEach(edge => {
        //     paths.push([[edge.va.x, edge.va.y], [edge.vb.x, edge.vb.y]])
        // });

        // delaunay
        diagram.edges.forEach(edge => {
            if (edge.lSite != null && edge.rSite != null) {
                paths.push([[edge.lSite.x, edge.lSite.y], [edge.rSite.x, edge.rSite.y]])
            }
        });

        // dots
        // paths = paths.concat(points.map(p => {
        //     var s = 1 - getPixel([p.x, p.y]) / 255 + 0.01
        //     if (isNaN(s)) { s = 0.01 }
        //     return pathUtils.circlePath(p.x, p.y, s / 2, 6)
        // }))


        // registration marks
        // paths.push(pathUtils.circlePath(0, 0, 2, 3))
        // paths.push(pathUtils.circlePath(0, h, 2, 4))
        // paths.push(pathUtils.circlePath(w, h, 2, 5))
        // paths.push(pathUtils.circlePath(w, 0, 2, 6))

        // console.log(paths.flat().reduce((a, b) => (a + b), 0))
        // paths = paths.concat(points.map(p => pathUtils.circlePath(p.x, p.y, 0.2, 10)))
        /////Transform output
        console.log(paths)
        //hacky rotate

        paths = paths.map(path => path.map(p => [p[1], p[0]]))

        paths = pathUtils.transform(paths, 2, 0, 0)

        return paths
    }

    this.star = function () {
        paths = []
        nLines = 50
        r = 20
        for (var i = 0; i < nLines; i++) {
            theta = Math.PI * i / nLines
            x = r * Math.cos(theta)
            y = r * Math.sin(theta)
            paths.push([[x, y], [-x, -y]])
        }

        // paths = pathUtils.transform(paths, 2, 50 + 20, 130 + 10 * (Math.sqrt(3) / 2))
        paths = pathUtils.transform(paths, 2, 50 + 20, 50)
        // paths = pathUtils.transform(paths, 2, 50, 50)
        return paths
    }

    this.randomGradient = function () {
        return this.gradient(Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 20)
    }


    this.gradient = function (x = 0, y = 0, w = 10, h = 50) {
        paths = []
        const nLines = 100
        var x = 0
        phase = Math.random() * 2 * Math.PI
        scale = Math.random()

        for (var i = 0; i < nLines; i++) {
            // ii = nLines - i
            // x = ii * ii / 5000
            x = i / nLines * h
            // x += Math.sin(Math.PI * 4 * i / nLines + phase) * 5 * scale
            x += Math.sin(-Math.PI * i / nLines) * 10

            // paths.push([[x - 10 * (Math.sqrt(3) / 2), 0], [x, 10]])
            paths.push([[x, 0], [x, w]])
        }
        console.log(paths)
        paths = pathUtils.transform(paths, 2, x, y)

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
