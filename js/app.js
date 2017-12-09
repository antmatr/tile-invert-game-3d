
'use strict';
const app = new Vue({
    el: '#app',
    data: {
        matrix: [],
        matrixBackup: [],
        rank: 3,
        newRank: 3,
        minRank: 2,
        maxRank: 5,
        square: 9,
        score: 0,
        baseCellState: 0,
        matrixSum: 0,
        matrixSumBackup: 0,
        status: 0,
        startX: 0,
        startY: 0,
        rotationX: 225,
        rotationY: 140,
        deltaX: 225,
        deltaY: 140,
        cubeTransform: 'translate(-50%, -50%) rotateX(140deg) rotateY(225deg)',
    },
    methods: {
        generate: function () {
            this.matrix = [];
            this.matrixBackup = [];
            this.rank = this.newRank;
            this.square = this.rank * this.rank;
            this.status = 0;
            this.baseCellState = Math.round(Math.random());
            this.matrixSum = this.baseCellState * this.square;

            for (let i = 0, s = this.rank; i < s; i++) {
                let row = [];
                for (let j = 0; j < s; j++) {
                    row.push(0);
                }
                this.matrixBackup.push(row);
            }

            for (let i = 0, s = this.rank; i < s; i++) {
                let row = [];
                for (let j = 0; j < s; j++) {
                    row.push(this.baseCellState);
                }
                this.matrix.push(row);
            }

            setTimeout(() => {
                let lastRow = Math.round(Math.random() * (this.rank - 1));
                let lastCell = Math.round(Math.random() * (this.rank - 1));
                for (let i = 0, d = this.rank * this.rank; i < d; i++) {
                    let row = Math.round(Math.random() * (this.rank - 1));
                    let cell = Math.round(Math.random() * (this.rank - 1));
                    if (row == lastRow && cell == lastCell) {
                        i--;
                    } else {
                        this.changeState(row, cell);
                        lastRow = row;
                        lastCell = cell;
                    }
                }

                for (let i = 0, s = this.rank; i < s; i++) {
                    for (let j = 0; j < s; j++) {
                        this.matrixBackup[i][j] = this.matrix[i][j];
                    }
                }

                this.matrixSumBackup = this.matrixSum;

            }, 500);

        },
        increaseRank () {
            this.newRank = Math.min(this.maxRank, this.newRank + 1);
        },
        decreaseRank () {
            this.newRank = Math.max(this.minRank, this.newRank - 1);
        },
        reset () {
            if (this.status === 1) {
                this.score -= this.square * this.square;
                this.status = 0;
            }
            for (let i = 0, s = this.rank; i < s; i++) {
                for (let j = 0; j < s; j++) {
                    Vue.set(this.matrix[i], j, this.matrixBackup[i][j]);
                }
            }
            this.matrixSum = this.matrixSumBackup;
        },
        invert (row, cell) {
            if (this.matrix[row][cell] === 0) {
                Vue.set(this.matrix[row], cell, 1);
                this.matrixSum++;
            } else {
                Vue.set(this.matrix[row], cell, 0);
                this.matrixSum--;
            }
        },
        checkWin () {
            if ((this.matrixSum === this.square || this.matrixSum === 0) && this.status !== 1) {
                this.score += this.square * this.square;
                this.status = 1;
            }
        },
        touch (row, cell) {
            this.changeState(row, cell);
            this.checkWin();
        },
        changeState (row, cell) {
            if (this.status !== 1) {
                this.invert(row, cell);
                if (row > 0) {
                    this.invert(row - 1, cell);
                }
                if (row < this.rank - 1) {
                    this.invert(row + 1, cell);
                }
                if (cell > 0) {
                    this.invert(row, cell - 1);
                }
                if (cell < this.rank - 1) {
                    this.invert(row, cell + 1);
                }
            }
        },
        rotate (e) {
            this.deltaX = Math.round((this.startX - e.pageX)/2) + this.rotationX;
            this.deltaY = Math.round((this.startY - e.pageY)/2) + this.rotationY;
            this.cubeTransform = 'translate(-50%, -50%) rotateX(' + this.deltaY + 'deg) rotateY(' + this.deltaX + 'deg)';
        }
    },
    created: function () {
        this.generate();
        document.addEventListener('mousedown', (e) => {
            this.startX = e.pageX;
            this.startY = e.pageY;
            document.addEventListener('mousemove', this.rotate);
        });
        document.addEventListener('mouseup', () => {
            this.rotationX = this.deltaX;
            this.rotationY = this.deltaY;
            document.removeEventListener('mousemove', this.rotate);
        });
    }
});
