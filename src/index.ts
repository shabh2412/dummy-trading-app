import express from "express";
import { config } from "../config/config";
import { currencies } from "currencies.json";
import { createServer } from "http";
import { Server } from "socket.io";
import * as dotenv from "dotenv";
dotenv.config();

let email = process.env.EMAIL || "guest@trader.io";
let password = process.env.PASSWORD || "12#4%^";
console.log(email);

const port = config.env.dev.port;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { createTransport } from "nodemailer";

export type appCurrencyType = {
	code: string;
	name: string;
	namePlural: string;
	rounding: number;
	symbol: string;
	symbolNative: string;
	decimalDigits: number;
	value: number;
	color: "green" | "red" | "white";
	changeBy: number;
	userOwns: number;
};

const transporter = createTransport({
	host: "smtp.ethereal.email",
	port: 587,
	auth: {
		user: email,
		pass: password,
	},
});

export type appDataType = {
	user: {
		email: string;
		password: string;
		walletBalance: number;
	};
	currencies: Array<appCurrencyType>;
};

const appCurrencies: Array<appCurrencyType> = currencies.map((currency) => {
	let curr: appCurrencyType = {
		...currency,
		value: Math.random() * 100,
		color: "white",
		changeBy: 0,
		userOwns: 0,
	};
	return curr;
});

let userWalletBalance = 1000;

const appData: appDataType = {
	currencies: appCurrencies,
	user: {
		email,
		password,
		walletBalance: userWalletBalance,
	},
};

app.get("/", (req, res) => {
	res.sendFile(`${process.cwd()}/public/index.html`);
	// res.send(currencies.slice(0, 20));
});

let timerid: ReturnType<typeof setInterval> | null = null;

io.on("connection", (socket) => {
	console.log("user connected");
	// below code will stop any existing intervals, so that there are no multiple intervals running at the same time.
	if (timerid) {
		clearInterval(timerid);
	}
	// starting the interval, and setting random values for each currency every one second. i'm adding some extra key-value pairs also in order to make the data more descriptive.
	timerid = setInterval(() => {
		for (let i = 0; i < appCurrencies.length; i++) {
			const changeBy = Math.random();
			const addOrSub = Math.random() > 0.5 ? "add" : "sub";
			const oldVal = appCurrencies[i].value;
			if (addOrSub === "add") {
				appCurrencies[i].value = oldVal + changeBy;
				appCurrencies[i].color = "red";
				appCurrencies[i].changeBy = -changeBy;
			} else {
				appCurrencies[i].value = oldVal - changeBy;
				appCurrencies[i].color = "green";
				appCurrencies[i].changeBy = changeBy;
			}
		}
		socket.emit("values", {
			currencies: appData.currencies,
			userWalletBalance: appData.user.walletBalance,
		});
	}, 1000);

	// this code will be executed 5 seconds after the user places a buy order.
	const buySuccessful = ({ code }: { code: string }) => {
		socket.emit("success", {
			message: `Your buy order of ${code} was completed successfully!`,
		});
	};
	const insufficientBalance = ({ code }: { code: string }) => {
		socket.emit("failure", {
			message: `Your buy order of ${code} was rejected. Reason: Insufficient balance!`,
		});
	};

	// buy event handler - for handling the order placed event.
	socket.on("buy", async ({ code }: { code: string }) => {
		console.log(`buy ${code}`);
		let info = await transporter.sendMail({
			from: "contact@trader.io",
			to: email,
			subject: "Buy Order is placed successfully!",
			text: `Your order of buy ${code} was placed successfully and it will be processed soon.`,
		});
		console.log(`mail sent: `, info.messageId);
		setTimeout(() => {
			// if (timerid) clearInterval(timerid);
			for (let i = 0; i < appCurrencies.length; i++) {
				if (appCurrencies[i].code === code) {
					if (appData.user.walletBalance >= appCurrencies[i].value) {
						appData.user.walletBalance -= appCurrencies[i].value;
						appCurrencies[i].userOwns++;
					} else {
						insufficientBalance({ code });
					}
					break;
				}
			}
			buySuccessful({ code });
		}, 5000);
	});
	// setTimeout(() => {}, 1000);
});

httpServer.listen(port, () => {
	console.log(`Server running on port: ${port}`);
});
