import { assert } from "chai"
import { SortTableNames } from "../lib/utils.js"

describe("SortTableNames function", () => {
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
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = []
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 2)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 2)

		// Act
		let sortedTableIds = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(["1", "1", "2", "2", "3", "3", "4", "4"], sortedTableIds)
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
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 2)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "1", "2", "2", "3", "3", "4", "4"],
			sortedTableNames
		)
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
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["2", "3"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 2)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "1", "2", "3", "2", "3", "4", "4"],
			sortedTableNames
		)
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
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "4"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 2)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "2", "2", "3", "3", "4", "1", "4"],
			sortedTableNames
		)
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
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "4"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 3)
		tableNamePages.set("2", 1)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 4)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "2", "3", "3", "4", "1", "4", "1", "4", "4"],
			sortedTableNames
		)
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
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 4)
		tableNamePages.set("3", 3)
		tableNamePages.set("4", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "2", "1", "2", "2", "2", "3", "3", "3", "4", "4"],
			sortedTableNames
		)
	})

	it("should return the correct array when there are no pages", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               0, 0, 0, 0

         Output:
            []
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 0)
		tableNamePages.set("2", 0)
		tableNamePages.set("3", 0)
		tableNamePages.set("4", 0)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual([], sortedTableNames)
	})

	it("should return the correct array when there is one page", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               0, 0, 0, 1

         Output:
            [4]
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 0)
		tableNamePages.set("2", 0)
		tableNamePages.set("3", 0)
		tableNamePages.set("4", 1)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(["4"], sortedTableNames)
	})

	it("should return the correct array when there are lots of pages for one table", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               6, 0, 0, 0

         Output:
            [1, 1, 1, 1, 1, 1]
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 6)
		tableNamePages.set("2", 0)
		tableNamePages.set("3", 0)
		tableNamePages.set("4", 0)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(["1", "1", "1", "1", "1", "1"], sortedTableNames)
	})

	it("should return the correct array when there are different counts of pages for parallel tables", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               6, 8, 1, 0

         Output:
            [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 2, 2, 3]
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 6)
		tableNamePages.set("2", 8)
		tableNamePages.set("3", 1)
		tableNamePages.set("4", 0)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			[
				"1",
				"2",
				"1",
				"2",
				"1",
				"2",
				"1",
				"2",
				"1",
				"2",
				"1",
				"2",
				"2",
				"2",
				"3"
			],
			sortedTableNames
		)
	})

	it("should return the correct array when there are multiple parallel tables", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4, 5
            parallelTableIds:   	1, 2, 3,    5
            pages:               2, 2, 2, 4, 2

         Output:
            [1, 2, 3, 4, 4, 4, 4, 5, 1, 2, 3, 5]
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4", "5"]
		let parallelTableNames = ["1", "2", "3", "5"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 2)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 4)
		tableNamePages.set("5", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "2", "3", "4", "4", "4", "4", "5", "1", "2", "3", "5"],
			sortedTableNames
		)
	})

	it("should return the correct array when there are multiple parallel tables with different counts of pages", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4, 5
            parallelTableIds:   	1, 2, 3,    5
            pages:               3, 6, 4, 3, 2

         Output:
            [1, 2, 3, 4, 4, 4, 5, 1, 2, 3, 5, 1, 2, 3, 2, 3, 2, 2]
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4", "5"]
		let parallelTableNames = ["1", "2", "3", "5"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 3)
		tableNamePages.set("2", 6)
		tableNamePages.set("3", 4)
		tableNamePages.set("4", 3)
		tableNamePages.set("5", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			[
				"1",
				"2",
				"3",
				"4",
				"4",
				"4",
				"5",
				"1",
				"2",
				"3",
				"5",
				"1",
				"2",
				"3",
				"2",
				"3",
				"2",
				"2"
			],
			sortedTableNames
		)
	})

	it("should return the correct array when there are pages for non-existent tables", () => {
		/*
         Input:
            tableIds:            1, 2, 3, 4
            parallelTableIds:   	1, 2
            pages:               2, 2, 2, 2, 2

         Output:
            [1, 2, 1, 2, 3, 3, 4, 4]
      */
		// Arrange
		let tableNames = ["1", "2", "3", "4"]
		let parallelTableNames = ["1", "2"]
		let tableNamePages = new Map<string, number>()
		tableNamePages.set("1", 2)
		tableNamePages.set("2", 2)
		tableNamePages.set("3", 2)
		tableNamePages.set("4", 2)
		tableNamePages.set("5", 2)

		// Act
		let sortedTableNames = SortTableNames(
			tableNames,
			parallelTableNames,
			tableNamePages
		)

		// Assert
		assert.deepEqual(
			["1", "2", "1", "2", "3", "3", "4", "4"],
			sortedTableNames
		)
	})
})
