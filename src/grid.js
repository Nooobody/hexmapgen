
export default class Grid {

  grid = []

  constructor(width, height, canvasWidth, canvasHeight, setGrid, setState) {
    this.setGrid = setGrid
    this.setState = setState
    this.gridWidth = width
    this.gridHeight = height
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight

    for (let x = 0; x < width; x++) {
      this.grid[x] = []
      let odd = x % 2 === 1
        ? 0.5
        : 0
      for (let y = 0; y < Math.round(height); y++) {
        this.grid[x][y] = {
          x,
          y,
          canvasX: (x / width) * canvasWidth,
          canvasY: ((y + odd) / height) * canvasHeight,
          fill: '#00ccff',
          stroke: 'rgba(0, 0, 0, 0.05)',
          type: 'ocean',
          meta: {
            initVisit: false
          }
        }
      }
    }
  }

  initializeGround() {
    // let islandCenter = this.grid[Math.floor(this.gridWidth / 2)][Math.floor(this.gridHeight / 2)]
    let islandCenter = this.grid[Math.floor(Math.random() * this.gridWidth)][Math.floor(Math.random() * this.gridHeight)]
    islandCenter = this.setAsGround(islandCenter)
    islandCenter = this.updatePointMeta(islandCenter, { initVisit: true })

    let neighbors = this.getNeighbors(islandCenter)
    let newNeighbors = []

    while (neighbors.length > 0) {
      for (let neighbor of neighbors) {
        let chance = 100 - this.dist(neighbor, islandCenter) * 3
        let groundChance = chance > Math.random() * 100
        if (groundChance) {
          neighbor = this.setAsGround(neighbor)
          newNeighbors = newNeighbors.concat(this.getNeighbors(neighbor, (p) => {
            return !p.meta.initVisit && !newNeighbors.includes(p)
          }))
        }
        neighbor = this.updatePointMeta(neighbor, { initVisit: true })
      }

      neighbors = newNeighbors.slice()
      newNeighbors = []
    }
    this.setGrid(this.grid)
    this.setState({ borders: this.getGroundBorders() })
  }

  getGroundBorders() {
    const borders = []
    const ground = this.flattenGrid(this.grid).filter(v => v.type === 'ground')

    const distX = (this.canvasWidth / this.gridWidth) / 2
    const distY = (this.canvasHeight / this.gridHeight) / 2
    const addX = distX / 3

    const rightEnd = ({ canvasX, canvasY }) => [canvasX + distX + addX, canvasY]
    const rightBottom = ({ canvasX, canvasY }) => [canvasX + distX / 3 + addX, canvasY + distY]
    const leftBottom = ({ canvasX, canvasY }) => [canvasX - distX / 3 - addX, canvasY + distY]
    const leftEnd = ({ canvasX, canvasY }) => [canvasX - distX - addX, canvasY]
    const leftTop = ({ canvasX, canvasY }) => [canvasX - distX / 3 - addX, canvasY - distY]
    const rightTop = ({ canvasX, canvasY }) => [canvasX + distX / 3 + addX, canvasY - distY]

    for (let point of ground) {
      let neighbors = this.getNeighbors(point, (p) => p.type !== 'ground')

      if (point.x === 0) {
        neighbors.push({ x: -1, y: point.y})
        neighbors.push({ x: -1, y: point.y - 1})
      }

      if (point.x === this.gridWidth - 1) {
        neighbors.push({ x: this.gridWidth, y: point.y})
        neighbors.push({ x: this.gridWidth, y: point.y + 1})
      }

      if (point.y === 0) {
        let odd = point.x % 2 === 1
        if (odd) {
          neighbors.push({ x: point.x, y: -1 })
        }
        else {
          neighbors.push({ x: point.x, y: -1 })
          neighbors.push({ x: point.x - 1, y: -1 })
          neighbors.push({ x: point.x + 1, y: -1 })
        }
      }

      if (point.y === this.gridHeight - 1) {
        let odd = point.x % 2 === 1
        if (!odd) {
          neighbors.push({ x: point.x, y: this.gridHeight })
        }
        else {
          neighbors.push({ x: point.x, y: this.gridHeight })
          neighbors.push({ x: point.x - 1, y: this.gridHeight })
          neighbors.push({ x: point.x + 1, y: this.gridHeight })
        }
      }

      for (let n of neighbors) {
        if (n.x === point.x) {
          if (n.y > point.y) {
            borders.push([rightBottom(point), leftBottom(point)])
          }
          else {
            borders.push([leftTop(point), rightTop(point)])
          }
        }
        else {
          let even = point.x % 2 === 0
          if (even) {
            if (point.x < n.x) {  // Is on the right
              if (n.y === point.y) {
                borders.push([rightEnd(point), rightBottom(point)])
              }
              else {
                borders.push([rightTop(point), rightEnd(point)])
              }
            }
            else {  // Is on the left
              if (n.y === point.y) {
                borders.push([leftBottom(point), leftEnd(point)])
              }
              else {
                borders.push([leftEnd(point), leftTop(point)])
              }
            }
          }
          else {
            if (point.x < n.x) { // Is on the right
              if (n.y === point.y) {
                borders.push([rightTop(point), rightEnd(point)])
              }
              else {
                borders.push([rightEnd(point), rightBottom(point)])
              }
            }
            else {  // Is on the left
              if (n.y === point.y) {
                borders.push([leftEnd(point), leftTop(point)])
              }
              else {
                borders.push([leftBottom(point), leftEnd(point)])
              }
            }
          }
        }
      }
    }

    return borders
  }

  getAllAtRange = (point, range) => {
    let points = []
    for (let x = -range + 1; x < range; x++) {
      for (let y = -range + 1; y < range; y++) {
        if (this.isPointInMap(point.x + x, point.y + y)) {
          points.push(this.grid[point.x + x][point.y + y])
        }
      }
    }

    let pointsToCheck = []

    let newPoint = [point.x, point.y + range]
    pointsToCheck.push(newPoint)
    if (point.x % 2 === 1) {
      pointsToCheck.push([ newPoint[0] + 1, newPoint[1] ])
      pointsToCheck.push([ newPoint[0] - 1, newPoint[1] ])
    }
    
    newPoint = [point.x, point.y - range]
    pointsToCheck.push(newPoint)
    if (point.x % 2 === 0) {
      pointsToCheck.push([ newPoint[0] + 1, newPoint[1] ])
      pointsToCheck.push([ newPoint[0] - 1, newPoint[1] ])
    }

    newPoint = [point.x - range, point.y]
    pointsToCheck.push(newPoint)
    if (point.x % 2 === 0) {
      pointsToCheck.push([ newPoint[0], newPoint[1] + 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] - 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] - 2])
    }
    else {
      pointsToCheck.push([ newPoint[0], newPoint[1] - 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] + 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] + 2])
    }

    newPoint = [point.x + range, point.y]
    pointsToCheck.push(newPoint)
    if (point.x % 2 === 1) {
      pointsToCheck.push([ newPoint[0], newPoint[1] - 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] + 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] + 2])
    }
    else {
      pointsToCheck.push([ newPoint[0], newPoint[1] + 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] - 1])
      pointsToCheck.push([ newPoint[0], newPoint[1] - 2])
    }

    for (let p of pointsToCheck) {
      if (this.isPointInMap(p[0], p[1])) {
        points.push(this.grid[p[0]][p[1]])
      }
    }

    return points
  }

  flattenGrid = (grid) => {
    return grid.reduce((acc, cur) => {
      return acc.concat(cur)
    }, [])
  }

  setAsGround = (point) => {
    return this.updatePoint(point, { fill: 'lightgreen', type: 'ground' })
  }

  isPointInMap = (x, y) => {
    return x >= 0 &&
           y >= 0 &&
           x < this.gridWidth &&
           y < this.gridHeight
  }

  updatePoint = (point, data) => {
    let p = Object.assign({}, point, data)
    this.grid[point.x][point.y] = p
    // this.setGrid(this.grid)
    return p
  }

  updatePointMeta = (point, data) => {
    let p = Object.assign({}, point, { meta: data })
    this.grid[point.x][point.y] = p
    // this.setGrid(this.grid)
    return p
  }

  dist = (a, b) => {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
  }

  getNeighbors = (point, filter=() => true) => {
    let neighbors = []
    if (point.y + 1 < this.gridHeight) {
      let p = this.grid[point.x][point.y + 1]
      if (filter(p)) {
        neighbors.push(p)
      }
    }
    if (point.y - 1 >= 0) {
      let p = this.grid[point.x][point.y - 1]
      if (filter(p)) {
        neighbors.push(p)
      }
    }

    if (point.x + 1 < this.gridWidth) {
      let p = this.grid[point.x + 1][point.y]
      if (filter(p)) {
        neighbors.push(p)
      }

      if (point.x % 2 === 1 && point.y + 1 < this.gridHeight) {
        let p = this.grid[point.x + 1][point.y + 1]
        if (filter(p)) {
          neighbors.push(p)
        }
      }
      else if (point.x % 2 === 0 && point.y - 1 >= 0) {
        let p = this.grid[point.x + 1][point.y - 1]
        if (filter(p)) {
          neighbors.push(p)
        }
      }
    }
    if (point.x - 1 >= 0) {
      let p = this.grid[point.x - 1][point.y]
      if (filter(p)) {
        neighbors.push(p)
      }
      if (point.x % 2 === 1 && point.y + 1 < this.gridHeight) {
        let p = this.grid[point.x - 1][point.y + 1]
        if (filter(p)) {
          neighbors.push(p)
        }
      }
      else if (point.x % 2 === 0 && point.y - 1 >= 0) {
        let p = this.grid[point.x - 1][point.y - 1]
        if (filter(p)) {
          neighbors.push(p)
        }
      }
    }
    return neighbors
  }
}
