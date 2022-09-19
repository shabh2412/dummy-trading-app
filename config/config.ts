export const config = {
	env: {
		dev: {
			port: process.env.PORT || 8080,
			dbConfig: {
				url: "mongodb://localhost:27017/myBlogs",
			},
		},
		// production configs come here.
		prod: {},
	},
};
