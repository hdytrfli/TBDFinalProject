const Movie = require('../models/movie.model');
const client = require('../database/cache');

// get all movies
const getAllMovies = (req, res) => {
	// get limit from req query
	const limit = req.query.limit ? parseInt(req.query.limit) : 10;

	// check redis cache
	client.get('movies', (err, movies) => {
		// handle error
		if (err) {
			console.log(err);
			res.status(500).json({
				error: err.message,
			});
		}

		// return data from cache
		if (movies) {
			console.log('from cache');
			res.json(JSON.parse(movies));
		}

		// return data from database
		else {
			Movie.find()
				.limit(limit)
				.then((movies) => {
					console.log('from database');
					res.json(movies);

					// save to redis cache
					client.setex('movies', 3600, JSON.stringify(movies));
				})
				.catch((err) => {
					res.status(500).json({
						error: err.message,
					});
				});
		}
	});
};

// create a new movie
const createMovie = (req, res) => {
	try {
		// validate request body
		if (!req.body) {
			res.status(400).json({
				error: 'Request body is missing',
			});
		}

		// create a new movie
		const { title, director, year, description, rating, imageUrl } = req.body;

		// validate request body
		if (!title || !director || !year || !description || !rating || !imageUrl) {
			res.status(400).json({
				error: 'Invalid request body',
			});
		}

		// create a new movie
		const movie = new Movie({
			title,
			director,
			year,
			description,
			rating,
			imageUrl,
		});

		// save movie to database
		movie
			.save()
			.then((movie) => {
				res.json(movie);
			})
			.catch((err) => {
				res.status(500).json({
					error: err.message,
				});
			});

		// clear redis cache
		client
			.del('movies')
			.then(() => {
				console.log('Cache cleared');
			})
			.catch((err) => {
				console.log(err);
			});
	} catch (err) {
		res.status(500).json({
			error: err.message,
		});
	}
};

// get movie by id
const getMovieById = (req, res) => {
	// get id from req params
	const id = req.params.id;

	// check redis cache
	client.get(id, (err, movie) => {
		// handle error
		if (err) {
			console.log(err);
			res.status(500).json({
				error: err.message,
			});
		}

		// return data from cache
		if (movie) {
			console.log('from cache');
			res.json(JSON.parse(movie));
		}

		// return data from database
		else {
			Movie.findById(id)
				.then((movie) => {
					console.log('from database');
					res.json(movie);

					// save to redis cache
					client.setex(id, 3600, JSON.stringify(movie));
				})
				.catch((err) => {
					res.status(500).json({
						error: err.message,
					});
				});
		}
	});
};

// update a movie
const updateMovie = (req, res) => {
	// get id from req params
	const id = req.params.id;

	// validate request body
	if (!req.body) {
		res.status(400).json({
			error: 'Request body is missing',
		});
	}

	// create a new movie
	const { title, director, year, description, rating, imageUrl } = req.body;

	// validate request body
	if (!title || !director || !year || !description || !rating || !imageUrl) {
		res.status(400).json({
			error: 'Invalid request body',
		});
	}

	// find and update movie
	Movie.findByIdAndUpdate(
		id,
		{
			title,
			director,
			year,
			description,
			rating,
			imageUrl,
		},
		{ new: true }
	)
		.then((movie) => {
			res.json(movie);
		})
		.catch((err) => {
			res.status(500).json({
				error: err.message,
			});
		});

	// clear redis cache
	client
		.del('movies')
		.then(() => {
			console.log('Cache cleared');
		})
		.catch((err) => {
			console.log(err);
		});
};

// delete a movie
const deleteMovie = (req, res) => {
	// get id from req params
	const id = req.params.id;

	// delete movie from database
	Movie.findByIdAndDelete(id)
		.then((movie) => {
			res.json(movie);
		})
		.catch((err) => {
			res.status(500).json({
				error: err.message,
			});
		});

	// clear redis cache
	client
		.del('movies')
		.then(() => {
			console.log('Cache cleared');
		})
		.catch((err) => {
			console.log(err);
		});
};

module.exports = { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie };
