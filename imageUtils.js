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

        function getOutline(cell) {
            verts = cell.halfedges.map(he => [he.edge.va, he.edge.vb]).flat(2)
            verts = verts.filter(uniquePoints);
            center = verts.reduce(add, { x: 0, y: 0 })
            center = mul(center, 1 / verts.length)
            pointsAndAngles = verts.map(p => { return { point: p, angle: getAngle(p, center) } })
            sorted = pointsAndAngles.sort((a, b) => a.angle - b.angle).map(e => e.point)
            sorted.push(sorted[0])
            // sorted = sorted.map(p => lerp(p, center, 0.2))
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

        for (var i = 0; i < bitmap.length; i += 4) {

            val = bitmap[i] + bitmap[i + 1] + bitmap[i + 2]
            val *= bitmap[i + 3] / 255
            grayscale.push(val / 3)
        }

        function getPixel(p) {
            return grayscale[(Math.round(p[0]) + Math.round(p[1]) * w)]
        }

        points = []
        const nPoints = 10000

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

            for (var x = 0; x < w; x++) {
                for (var y = 0; y < h; y++) {

                    const brightness = 255 - grayscale[x + y * w]
                    point = { x: x + 0.5, y: y + 0.5 }
                    const near = tree.nearest(point, 1)[0][0]

                    const idx = points.findIndex(p => {
                        return p.x == near.x && p.y == near.y
                    })

                    weightedSums[idx] = add(weightedSums[idx], mul(point, brightness))
                    // weightedSums[idx] = add(weightedSums[idx], point)
                    numPixels[idx] += brightness
                }
            }
            return weightedSums.map((e, i) => mul(e, 1 / numPixels[i]))
        }

        // // Relax the diagram by moving points to the weighted centroid.
        // // Wiggle the points a little bit so they don’t get stuck.
        // const w = Math.pow(k + 1, -0.8) * 10;
        // for (let i = 0; i < n; ++i) {
        //     const x0 = points[i * 2], y0 = points[i * 2 + 1];
        //     const x1 = s[i] ? c[i * 2] / s[i] : x0, y1 = s[i] ? c[i * 2 + 1] / s[i] : y0;
        //     points[i * 2] = x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * w;
        //     points[i * 2 + 1] = y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * w;
        // }


        // relax
        const iterations = 12
        for (var ii = 0; ii < iterations; ii++) {
            console.log(ii)
            voronoi = new Voronoi()
            bbox = getBbox(points)
            diagram = voronoi.compute(points, bbox);

            points = diagram.cells.map((cell) => ({ x: cell.site.x, y: cell.site.y }))

            centroids = getWeightedCentroids(points);

            // centroids = diagram.cells.map(cell => getCentroid(cell));

            for (var j = 0; j < points.length; j++) {
                dir = sub(centroids[j], points[j])
                const l = length(dir)

                dir = mul(dir, 1 / (l + 0.0001))
                dir = mul(dir, 0.1)
                points[j] = add(points[j], dir)
                // points[j] = add(points[j], { x: Math.random(), y: Math.random() })
            }

        }

        // paths = paths.concat(
        //     diagram.cells.map(cell => {
        //         return getOutline(cell).map(p => [p.x, p.y])
        //     })
        // )
        console.log(points, centroids)
        paths = paths.concat(points.map(p => {
            var s = 1 - getPixel([p.x, p.y]) / 255 + 0.001
            if (isNaN(s)) {
                s = 0.01
            }

            return pathUtils.circlePath(p.x, p.y, s/2, 6)

        }))

        // console.log(paths.flat().reduce((a, b) => (a + b), 0))


        // paths = paths.concat(points.map(p => pathUtils.circlePath(p.x, p.y, 0.2, 10)))
        /////Transform output
        var scale = 50
        paths = paths.map(path => path.map(p => [p[0] * scale, p[1] * scale]))
        // tx = 3000
        // ty = 3000
        // paths = paths.map(path => path.map(p => [p[0] + tx, p[1] + ty]))
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
