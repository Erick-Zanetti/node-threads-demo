import { parentPort, workerData } from 'worker_threads';

const multiplyMatrices = (A, B) => {
  const result = [];
  for (let i = 0; i < A.length; i++) {
    result[i] = [];
    for (let j = 0; j < B[0].length; j++) {
      result[i][j] = 0;
      for (let k = 0; k < B.length; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
};

const { matrixA, matrixB, startRow, endRow } = workerData;
const partialResult = multiplyMatrices(matrixA.slice(startRow, endRow), matrixB);
parentPort.postMessage(partialResult);
