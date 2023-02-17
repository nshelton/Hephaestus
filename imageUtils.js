
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
        regular = []

        nPoints = 10000

        while (points.length < nPoints) {
            var x = Math.random() * w
            var y = Math.random() * h

            var brightness = getPixel([x, y]) / 255
            if (Math.random() >= brightness) {
                points.push([x, y]);
            }
        }
        const step = 64
        for (var i = step / 2; i < w; i += step) {
            for (var j = step / 2; j < h; j += step) {
                // regular.push([i, j]);
                regular.push([i + Math.random() * step, j + Math.random() * step]);
            }
        }

        voronoi = new Voronoi()
        sites = regular.map(p => { return { x: p[0], y: p[1] } })
        bbox = { xl: 0, xr: w + step, yt: 0, yb: h + step }
        diagram = voronoi.compute(sites, bbox);

        // var rejectionSites = sites.slice();
        // originalRejection = sites.slice();


        // diagram.edges.forEach(edge => {
        //     paths.push([[edge.va.x, edge.va.y], [edge.vb.x, edge.vb.y]])
        // });

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
        function onlyUnique(value, index, array) {
            return array.findIndex(v => v.x == value.x && v.y == value.y) === index;
        }

        paths = []

        function get_polygon_centroid(pts) {
            var first = pts[0], last = pts[pts.length - 1];
            if (first.x != last.x || first.y != last.y) pts.push(first);
            var twicearea = 0,
                x = 0, y = 0,
                nPts = pts.length,
                p1, p2, f;
            for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
                p1 = pts[i]; p2 = pts[j];
                f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
                twicearea += f;
                x += (p1.x + p2.x - 2 * first.x) * f;
                y += (p1.y + p2.y - 2 * first.y) * f;
            }
            f = twicearea * 3;
            return [x / f + first.x, y / f + first.y];
        }

        function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } }
        function mul(a, b) { return { x: a.x * b, y: a.y * b } }
        function add(a, b) { return { x: a.x + b.x, y: a.y + b.y } }
        function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } }

        function getAngle(a, b) {
            const l = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
            return Math.atan2((a.x - b.x), (a.y - b.y)) + Math.PI
        }

        function getOutline(cell) {
            verts = cell.halfedges.map(he => [he.edge.va, he.edge.vb]).flat(2)
            verts = verts.filter(onlyUnique);
            center = verts.reduce(add, { x: 0, y: 0 })
            center = mul(center, 1 / verts.length)
            pointsAndAngles = verts.map(p => { return { point: p, angle: getAngle(p, center) } })
            sorted = pointsAndAngles.sort((a, b) => a.angle - b.angle).map(e => e.point)
            sorted.push(sorted[0])
            sorted = sorted.map(p => lerp(p, center, 0.2))
            return sorted
        }

        paths = paths.concat(
            diagram.cells.map(cell => {
                return getOutline(cell).map(p => [p.x, p.y])
            })
        )

        // centroids = paths.concat(diagram.cells.map(cell => {

        //     return get_polygon_centroid(outline)
        // }));

        // diagram.cells.map(cell => {
        //     outline = getOutline(cell)
        //     paths.push(outline)
        // })

        console.log(paths)

        console.log("NANs???", verts.flat().reduce(add, { x: 0, y: 0 }))

        paths.each

        // paths = paths.concat(centroids.map(p => pathUtils.circlePath(p[0], p[1], 4, 5)))

        // console.log(paths)

        // paths = paths.concat(regular.map(p => pathUtils.circlePath(p[0], p[1], 0.5, 10)))

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
