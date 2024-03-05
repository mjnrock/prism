export default {
	testEnvironment: "node",
	transform: {
		"^.+\\.js$": "babel-jest"
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	setupFiles: [ "<rootDir>/jest.setup.js" ],
};  