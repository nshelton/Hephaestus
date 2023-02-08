
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

    this.optomize = function (paths) {

        score = this.getScore(paths)
        console.log(score)

        picked = paths.map( p => 0)

        reorderedPaths = [paths[0]]
        picked[0] = 1

        while(reorderedPaths.length < paths.length) {
            thisPath = reorderedPaths[reorderedPaths.length-1]

            bestPathIdx = 0
            bestDistance = 1e10
            bestPath = null

            for(var i = 0;i < paths.length; i ++) {
                if (picked[i] == 0) {
                    //forward
                    dx = Math.round(paths[i][0][0] - thisPath[thisPath.length-1][0])
                    dy = Math.round(paths[i][0][1] - thisPath[thisPath.length-1][1])
                    distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < bestDistance) {
                        bestPathIdx = i
                        bestDistance = distance
                        bestPath = paths[i]
                    }

                    //backward
                    dx = Math.round(paths[i][paths[i].length-1][0] - thisPath[thisPath.length-1][0])
                    dy = Math.round(paths[i][paths[i].length-1][1] - thisPath[thisPath.length-1][1])
                    distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < bestDistance) {
                        bestPathIdx = i
                        bestDistance = distance
                        bestPath = paths[i].reverse()
                    }
                }
            }

            reorderedPaths.push( bestPath )
            picked[bestPathIdx] = 1
        }

        newScore = this.getScore(reorderedPaths)
        console.log(newScore)

        return reorderedPaths
    }

};