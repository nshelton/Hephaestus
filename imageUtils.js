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


        grayscale = []
        if (grayscale.length % 4 != 0) {
            alert("invalid image")
            return
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

        for (var i = 0; i < bitmap.length; i += 4) {

            val = bitmap[i] + bitmap[i + 1] + bitmap[i + 2]

            cmyk = rbg2cmyk(bitmap[i], bitmap[i + 1], bitmap[i + 2])
            // specific channels
            // val = bitmap[i + 2] * 3
            val = 255 - cmyk[2]
            // val *= bitmap[i + 3] / 255

            grayscale.push(val)
        }

        function getPixel(p) {
            return grayscale[(Math.round(p[0]) + Math.round(p[1]) * w)]
        }

        points = []
        const nPoints = 20000

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

                    const brightness = 255 - grayscale[x + y * w]
                    point = { x: x + 0.5, y: y + 0.5 }
                    const near = tree.nearest(point, 1)[0][0]

                    var idx = lastIdx
                    if (!(points[lastIdx].x == near.x && points[lastIdx].y == near.y)) {
                        idx = lastIdx
                    } else {
                        const idx = points.findIndex(p => {
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
        const iterations = 20
        for (var ii = 0; ii < iterations; ii++) {
            console.log(ii)
            bbox = getBbox(points)
            if (ii % 3 == 0) {
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
        }


        diagram = voronoi.compute(points, bbox);

        // paths = paths.concat(
        //     diagram.cells.map(cell => {
        //         return getOutline(cell, 0.1).map(p => [p.x, p.y])
        //     })
        // )

        // diagram.edges.forEach(edge => {
        //     paths.push([[edge.va.x, edge.va.y], [edge.vb.x, edge.vb.y]])
        // });

        // diagram.edges.forEach(edge => {
        //     if (edge.lSite != null && edge.rSite != null) {
        //         paths.push([[edge.lSite.x, edge.lSite.y], [edge.rSite.x, edge.rSite.y]])
        //     }
        // });

        paths = paths.concat(points.map(p => {
            var s = 1 - getPixel([p.x, p.y]) / 255 + 0.001
            if (isNaN(s)) { s = 0.01 }

            return pathUtils.circlePath(p.x, p.y, s / 2, 6)
        }))


        // registration marks
        paths.push(pathUtils.circlePath(0, 0, 2, 3))
        paths.push(pathUtils.circlePath(0, h, 2, 4))
        paths.push(pathUtils.circlePath(w, h, 2, 5))
        paths.push(pathUtils.circlePath(w, 0, 2, 6))

        // console.log(paths.flat().reduce((a, b) => (a + b), 0))
        // paths = paths.concat(points.map(p => pathUtils.circlePath(p.x, p.y, 0.2, 10)))
        /////Transform output

        paths = pathUtils.transform(paths, 20, 1000, 1000)

        return paths
    }

    this.gradient = function () {
        paths = []
        const nLines = 100
        var x = 0

        for (var i = 0; i < nLines; i++) {
            ii = nLines - i
            x += ii * ii / 5000
            paths.push([[x + 10 * (Math.sqrt(3) / 2), 0], [x, 10]])
        }

        console.log(paths)
        paths = pathUtils.transform(paths, 200, 1000, 8000)
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
