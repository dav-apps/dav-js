import 'mocha'
import { assert } from 'chai'
import { SortTableIds } from '../lib/utils'

describe("SortTableIds function", () => {
	it("should return the correct array when there are no parallel table ids", () => {
      /*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:    
            pages:               2, 2, 2, 2

         Output:
            [1, 1, 2, 2, 3, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = []
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], sortedTableIds)
	})

	it("should return the correct array when there is one parallel table id", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:    	2
            pages:               2, 2, 2, 2

         Output:
            [1, 1, 2, 2, 3, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [2]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 1, 2, 2, 3, 3, 4, 4], sortedTableIds)
	})

	it("should return the correct array when the parallel table ids are side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:    	2, 3
            pages:               2, 2, 2, 2

         Output:
            [1, 1, 2, 3, 2, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [2, 3]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 1, 2, 3, 2, 3, 4, 4], sortedTableIds)
	})

	it("should return the correct array when the parallel table ids are not side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1,			4
            pages:               2, 2, 2, 2

         Output:
            [1, 2, 2, 3, 3, 4, 1, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [1, 4]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 2)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 2, 2, 3, 3, 4, 1, 4], sortedTableIds)
	})

	it("should return the correct array when there are different pages and the parallel table ids are not side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1,			4
            pages:               3, 1, 2, 4

         Output:
            [1, 2, 3, 3, 4, 1, 4, 1, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [1, 4]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 3)
		tableIdPages.set(2, 1)
		tableIdPages.set(3, 2)
		tableIdPages.set(4, 4)

		// Act
		let sortedTableIds = SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 2, 3, 3, 4, 1, 4, 1, 4, 4], sortedTableIds)
	})

	it("should return the correct array when there are different pages and the parallel table ids are side by side", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               2, 4, 3, 2

         Output:
            [1, 2, 1, 2, 2, 2, 3, 3, 3, 4, 4]
      */
		// Arrange
		let tableIds = [1, 2, 3, 4]
		let parallelTableIds = [1, 2]
		let tableIdPages = new Map<number, number>()
		tableIdPages.set(1, 2)
		tableIdPages.set(2, 4)
		tableIdPages.set(3, 3)
		tableIdPages.set(4, 2)

		// Act
		let sortedTableIds = SortTableIds(tableIds, parallelTableIds, tableIdPages)

		// Assert
		assert.deepEqual([1, 2, 1, 2, 2, 2, 3, 3, 3, 4, 4], sortedTableIds)
	})
})