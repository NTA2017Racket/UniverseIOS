import {observable} from 'mobx';
import net from 'net';
import RouterManager from '../RouterManager';

//Just for debugging react native on a device.
//jsCodeLocation = [NSURL URLWithString:@"http://192.168.0.110:8081/index.ios.bundle?platform=ios&dev=true&minify=false"];

class ConnectionStore {
	@observable CurrentState = 'notConnected';
	@observable hostname = '';
	@observable port = '8080';
	@observable ButtonError = '';
	currentErrorTimeout = null;
	@observable ErrorAnimation = 'fadeIn';
	netClient = null;
	@observable username = 'anonym';
	@observable degree = '';
	@observable prompt = false;

	setCurrentState(newState) {
		this.CurrentState = newState;
	}

	setButtonError(error) {
		this.ErrorAnimation = 'fadeIn';
		this.ButtonError = error;
		this.CurrentState = 'error';
		const self = this;
		if (self.currentErrorTimeout) {
			clearInterval(self.currentErrorTimeout);
			self.currentErrorTimeout = null;
		}
		this.currentErrorTimeout = setTimeout(function () {
			if (self.CurrentState !== 'connected') {
				self.CurrentState = 'notConnected';
				this.ErrorAnimation = 'fadeOut';
				this.ButtonError = '';
			}
		}, 2000);
	}

	_connect() {
		try {
			this.netClient = net.createConnection({port: parseInt(this.port), host: this.hostname});
			const self = this;
			this.netClient.on('connect', function () {
				self.changeUsername();
				RouterManager.goToUniverse();
				self.CurrentState = 'notConnected';
			});
			this.netClient.on('close', function () {
				RouterManager.resetToInit();
				setTimeout(function () {
					self.CurrentState = 'notConnected';
				}, 500);
			});
			this.netClient.on('error', (e) => {
				self.setButtonError(e.message);
				console.error(e);
				//throw e;
			});
		} catch (e) {
			console.error(e);
			//throw e;
			self.setButtonError(e.message);
		}

	}

	connect() {
		if (!this.hostname) {
			this.setButtonError('No hostname');
			return;
		}
		const self = this;
		try {
			const port = parseInt(self.port);
			if (!port) {
				self.setButtonError('No port');
				return;
			}
			self.CurrentState = 'connecting';
			self._connect();
		} catch (e) {
			self.setButtonError('No valid port');
		}
	}

	setHostname(newHostname) {
		this.hostname = newHostname;
	}

	setPort(newPort) {
		this.port = newPort;
	}

	setUsername(newUsername) {
		this.username = newUsername;
	}

	changeUsername(username) {
		this.prompt = false;
		const self = this;
		try {
			if (self.username) {
				self.username = username || self.username;
				self.netClient.write('c ' + self.username + '\n');
			}
		} catch (e) {
			console.log(e);
		}
	}
}

export default new ConnectionStore();