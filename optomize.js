
Optomizer = function () {

    this.getScore = function (paths) {

        totalDistance = 0

        plotterPos = [0, 0]

        function moveTo(p) {
            dx = Math.round(p[0] - plotterPos[0])
            dy = Math.round(p[1] - plotterPos[1])
            totalDistance += Math.sqrt(dx * dx + dy * dy)
            plotterPos = p
        }

        paths.forEach(path => {

            moveTo(path[0])
            for (var i = 1; i < path.length; i++) {
                moveTo(path[i])
            }
        })
        moveTo([0, 0])

        return totalDistance
    }

    this.optomizeSlow = function (paths) {

        paths = paths.filter(p => p.length > 0)

        score = this.getScore(paths)
        console.log(score)


        picked = paths.map(p => 0)

        reorderedPaths = [paths[0]]
        picked[0] = 1

        while (reorderedPaths.length < paths.length) {
            thisPath = reorderedPaths[reorderedPaths.length - 1]

            bestPathIdx = 0
            bestDistance = 1e10
            bestPath = null

            for (var i = 0; i < paths.length; i++) {
                if (picked[i] == 0) {
                    //forward
                    dx = Math.round(paths[i][0][0] - thisPath[thisPath.length - 1][0])
                    dy = Math.round(paths[i][0][1] - thisPath[thisPath.length - 1][1])
                    distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < bestDistance) {
                        bestPathIdx = i
                        bestDistance = distance
                        bestPath = paths[i]
                    }

                    //backward
                    dx = Math.round(paths[i][paths[i].length - 1][0] - thisPath[thisPath.length - 1][0])
                    dy = Math.round(paths[i][paths[i].length - 1][1] - thisPath[thisPath.length - 1][1])
                    distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < bestDistance) {
                        bestPathIdx = i
                        bestDistance = distance
                        bestPath = paths[i].reverse()
                    }
                }
            }

            reorderedPaths.push(bestPath)
            picked[bestPathIdx] = 1
        }

        newScore = this.getScore(reorderedPaths)
        console.log(newScore)

        return reorderedPaths
    }


    this.optomizeGrid = function (paths) {
        paths = paths.filter(p => p.length > 0)

        score = this.getScore(paths)
        console.log(score)

        picked = paths.map(p => 0)

        reorderedPaths = [paths[0]]
        picked[0] = 1

        while (reorderedPaths.length < paths.length) {
            thisPath = reorderedPaths[reorderedPaths.length - 1]

            bestPathIdx = 0
            bestDistance = 1e10
            bestPath = null

            for (var i = 0; i < paths.length; i++) {
                if (picked[i] == 0) {
                    //forward
                    dx = Math.round(paths[i][0][0] - thisPath[thisPath.length - 1][0])
                    dy = Math.round(paths[i][0][1] - thisPath[thisPath.length - 1][1])
                    distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < bestDistance) {
                        bestPathIdx = i
                        bestDistance = distance
                        bestPath = paths[i]
                    }

                    //backward
                    dx = Math.round(paths[i][paths[i].length - 1][0] - thisPath[thisPath.length - 1][0])
                    dy = Math.round(paths[i][paths[i].length - 1][1] - thisPath[thisPath.length - 1][1])
                    distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < bestDistance) {
                        bestPathIdx = i
                        bestDistance = distance
                        bestPath = paths[i].reverse()
                    }
                }
            }

            reorderedPaths.push(bestPath)
            picked[bestPathIdx] = 1
        }

        newScore = this.getScore(reorderedPaths)
        console.log(newScore)

        return reorderedPaths
    }


    this.optomizeKD = function (paths) {

        paths = paths.filter(p => p.length > 0)

        score = this.getScore(paths)
        console.log(score)

        var distance = function (a, b) {
            return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
        }

        pointsStart = paths.map((p, idx) => ({ x: p[0][0], y: p[0][1], i: idx }))
        pointsStart.shift()
        idToPathMapStart = {}
        pointsStart.forEach(obj => idToPathMapStart[obj.i] = obj)

        pointsEnd = paths.map((p, idx) => ({ x: p[p.length - 1][0], y: p[p.length - 1][1], i: idx }))
        pointsEnd.shift()
        idToPathMapEnd = {}
        pointsEnd.forEach(obj => idToPathMapEnd[obj.i] = obj)

        // var treeStarts = new kdTree(pointsStart, distance, ["x", "y"]);
        var treeStarts = new kdTree([], distance, ["x", "y"]);
        pointsStart.forEach(x => treeStarts.insert(x));
        var treeEnds = new kdTree([], distance, ["x", "y"]);
        pointsEnd.forEach(x => treeEnds.insert(x));


        reorderedPaths = [paths[0]]
        pathsConsumed = 1

        while (pathsConsumed < paths.length) {

            lastPath = reorderedPaths[reorderedPaths.length - 1]

            // console.log(lastPath, reorderedPaths)
            endOfLastPath = {
                x: lastPath[lastPath.length - 1][0],
                y: lastPath[lastPath.length - 1][1]
            }

            closestStart = treeStarts.nearest(endOfLastPath, 1)[0]
            closestEnd = treeEnds.nearest(endOfLastPath, 1)[0]

            // console.log(closestEnd, closestStart)

            if (closestStart < closestEnd) {
                i = closestStart[0].i
                distance = closestStart[1]
                treeStarts.remove(closestStart[0])
                treeEnds.remove(idToPathMapEnd[i])
                bestPath = paths[i]
            } else {
                i = closestEnd[0].i
                distance = closestEnd[1]
                treeEnds.remove(closestEnd[0])
                treeStarts.remove(idToPathMapStart[i])
                bestPath = paths[i]
            }

            if (closestEnd < closestStart) {
                bestPath = bestPath.reverse()
            }

            // merge if too close
            if (distance < 0.001) {
                reorderedPaths[reorderedPaths.length - 1] = lastPath.concat(bestPath.slice(1))

            } else {
                reorderedPaths.push(bestPath)
            }

            pathsConsumed++;
        }

        newScore = this.getScore(reorderedPaths)
        console.log(newScore)

        return reorderedPaths
    }


    this.kdTreeTest = function () {


        testpaths = [
            [[50, 50], [75, 50], [75, 75], [50, 75], [50, 50]],
            [[50, 80], [75, 80], [75, 105], [50, 105], [50, 80]],
            [[50, 110], [75, 110], [75, 135], [50, 135], [50, 110]],
            [[80, 50], [105, 50], [105, 75], [80, 75], [80, 50]],
            [[80, 80], [105, 80], [105, 105], [80, 105], [80, 80]],
            [[80, 110], [105, 110], [105, 135], [80, 135], [80, 110]],
            [[110, 50], [135, 50], [135, 75], [110, 75], [110, 50]],
            [[110, 80], [135, 80], [135, 105], [110, 105], [110, 80]],
            [[110, 110], [135, 110], [135, 135], [110, 135], [110, 110]
            ]
        ]

        pointsStart = testpaths.map(p => p[0])
        pointsStart = pointsStart.map((p, i) => ({ x: p[0], y: p[1], i: i }))
        console.log(pointsStart)
        var distance = function (a, b) {
            return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
        }

        var tree = new kdTree([], distance, ["x", "y"]);
        pointsStart.forEach(x => {
            console.log(tree)
            tree.insert(x)
        }

        );
        // var treeEnds = new kdTree(pointsEnd, distance, ["x", "y"]);

        function numNodes() { return tree.nearest([0, 0], 20).length }

        reorderedPaths = [paths[0]]
        console.log(numNodes(), "nodes")
        console.log("tree:", tree.toJSON())

        for (var i = 0; i < 9; i++) {
            tree.remove(pointsStart[i])
            console.log(numNodes(), "nodes")
        }



    }
};