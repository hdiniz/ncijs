require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/nci.js":[function(require,module,exports){
var getOctetFromString = function(string, index) {
    var a = string.substr(index*2, 2);
    return !!a ? parseInt(a, 16) : null;
}

var NciDecoder = function() {
}

NciDecoder.MT = {
    DATA: 'DATA',
    CMD: 'CMD',
    RSP: 'RSP',
    NTF: 'NTF',
    RFU: 'RFU'
};

NciDecoder.GID = {
    NCI_CORE: 'NCI_CORE',
    RF_MANAGEMENT: 'RF_MANAGEMENT',
    NFCEE_MANAGEMENT: 'NFCEE_MANAGEMENT',
    RFU: 'RFU',
    PROPRIETARY: 'PROPRIETARY'
};


NciDecoder.decode = function (packet) { 
    var resp = {};
    resp.cursor = 0;
    resp.packet = packet;
    var first_byte = getOctetFromString(resp.packet, resp.cursor++);
   
    if ((first_byte & 0x10) == 0x10) {
        resp.PBF = true;
    } else {
        resp.PBF = false;
    }

    var mt = first_byte & 0xE0;
    if (mt == 0x00) {
        resp.MT = NciDecoder.MT.DATA;
    } else if (mt == 0x20) { 
        resp.MT = NciDecoder.MT.CMD;
    } else if (mt == 0x40) {
        resp.MT = NciDecoder.MT.RSP;
    } else if (mt == 0x60) {
        resp.MT = NciDecoder.MT.NTF;
    } else {
        resp.MT = NciDecoder.MT.RFU;
    }
    
    if (resp.MT == NciDecoder.MT.DATA) {
    } else if (resp.MT != NciDecoder.MT.RFU) { // Control Packets only
        var gid = first_byte & 0x0F;
		var second_byte = getOctetFromString(resp.packet, resp.cursor++);
		var oid = second_byte & 0x3F;
		
        if (gid == 0x00) {
            resp.GID = NciDecoder.GID.NCI_CORE;
            NciDecoder.decodeNciCore(oid, resp);
        } else if (gid == 0x01) {
            resp.GID = NciDecoder.GID.RF_MANAGEMENT;
            NciDecoder.decodeRfManagement(oid, resp);
        } else if (gid == 0x02) {
            resp.GID = NciDecoder.GID.NFCEE_MANAGEMENT;
			NciDecoder.decodeNfceeManagement(oid, resp);
        } else if (gid == 0x0F) {
            resp.GID = NciDecoder.GID.PROPRIETARY;
        } else {
            resp.GID = NciDecoder.GID.RFU;
        }
    } else { // RFU packets
    }
	
    resp.toString = function() {
        var tostr = '[' + this.MT + '][' + this.GID + '] ' + this.OID + ': ' + this.packet;
        if (this.dummy != undefined) {
                tostr += ' (' + this.dummy + ')';
        }
        return tostr;
    }
	
    return resp;
}


NciDecoder.OID = {
	CORE_RESET: 'CORE_RESET',
	CORE_INIT: 'CORE_INIT',
	CORE_SET_CONFIG: 'CORE_SET_CONFIG',
	CORE_GET_CONFIG: 'CORE_GET_CONFIG',
	CORE_CONN_CREATE: 'CORE_CONN_CREATE',
	CORE_CONN_CLOSE: 'CORE_CONN_CLOSE',
	CORE_CONN_CREDITS: 'CORE_CONN_CREDITS',
	CORE_GENERIC_ERROR: 'CORE_GENERIC_ERROR',
	CORE_INTERFACE_ERROR: 'CORE_INTERFACE_ERROR',
	
	RF_DISCOVER_MAP: 'RF_DISCOVER_MAP',
	RF_SET_LISTEN_MODE_ROUTING: 'RF_SET_LISTEN_MODE_ROUTING',
	RF_GET_LISTEN_MODE_ROUTING: 'RF_GET_LISTEN_MODE_ROUTING',
	RF_DISCOVER: 'RF_DISCOVER',
	RF_DISCOVER_SELECT: 'RF_DISCOVER_SELECT',
	RF_INTF_ACTIVATED: 'RF_INTF_ACTIVATED',
	RF_DEACTIVATE: 'RF_DEACTIVATE',
	RF_FIELD_INFO: 'RF_FIELD_INFO',
	RF_T3T_POLLING: 'RF_T3T_POLLING',
	RF_NFCEE_ACTION: 'RF_NFCEE_ACTION',
	RF_NFCEE_DISCOVERY_REQ: 'RF_NFCEE_DISCOVERY_REQ',
	RF_PARAMETER_UPDATE: 'RF_PARAMETER_UPDATE',
	RF_LLCP_SYMMETRY_START: 'RF_LLCP_SYMMETRY_START',
	RF_LLCP_SYMMETRY_STOP: 'RF_LLCP_SYMMETRY_STOP',
	RF_AGGREGATE_ABORT: 'RF_AGGREGATE_ABORT',
	
	NFCEE_DISCOVER: 'NFCEE_DISCOVER',
	NFCEE_MODE_SET: 'NFCEE_MODE_SET',
	
	RFU: 'RFU'
};


NciDecoder.getStatusCode = function(code) {
	if (code == 0x00) {
		return 'STATUS_OK';
	} else if (code == 0x01) {
		return 'STATUS_REJECTED';
	} else if (code == 0x03) {
		return 'STATUS_FAILED';
	} else if (code == 0x04) {
		return 'STATUS_NOT_INITIALIZED';
	} else if (code == 0x05) {
		return 'STATUS_SYNTAX_ERROR';
	} else if (code == 0x06) {
		return 'STATUS_SEMANTIC_ERROR';
	} else if (code == 0x09) {
		return 'STATUS_INVALID_PARAM';
	} else if (code == 0x0A) {
		return 'STATUS_MESSAGE_SIZE_EXCEEDED';
	} else if (code == 0x11) {
		return 'STATUS_OK_1_BIT';
	} else if (code == 0x12) {
		return 'STATUS_OK_2_BIT';
	} else if (code == 0x13) {
		return 'STATUS_OK_3_BIT';
	} else if (code == 0x14) {
		return 'STATUS_OK_4_BIT';
	} else if (code == 0x15) {
		return 'STATUS_OK_5_BIT';
	} else if (code == 0x16) {
		return 'STATUS_OK_6_BIT';
	} else if (code == 0x17) {
		return 'STATUS_OK_7_BIT';
	} else if (code == 0xA0) {
		return 'DISCOVERY_ALREADY_STARTED';
	} else if (code == 0xA1) {
		return 'DISCOVERY_TARGET_ACTIVATION_FAILED';
	} else if (code == 0xA2) {
		return 'DISCOVERY_TEAR_DOWN';
	} else if (code == 0x02) {
		return 'RF_FRAME_CORRUPTED';
	} else if (code == 0xB0) {
		return 'RF_TRANSMISSION_ERROR';
	} else if (code == 0xB1) {
		return 'RF_PROTOCOL_ERROR';
	} else if (code == 0xB2) {
		return 'RF_TIMEOUT_ERROR';
	} else if (code == 0xB3) {
		return 'RF_UNEXPECTED_DATA';
	} else if (code == 0xC0) {
		return 'NFCEE_INTERFACE_ACTIVATION_FAILED';
	} else if (code == 0xC1) {
		return 'NFCEE_TRANSMISSION_ERROR';
	} else if (code == 0xC2) {
		return 'NFCEE_PROTOCOL_ERROR';
	} else if (code == 0xC3) {
		return 'NFCEE_TIMEOUT_ERROR';
	} else if (code >= 0xE0 && code <= 0xDF) {
		return 'For proprietary use';
	} else {
		return 'RFU';
	}
}

NciDecoder.decodeNfceeManagement = function(oid, resp) {

    if (oid == 0x00) {
		resp.OID = NciDecoder.OID.NFCEE_DISCOVER;
    } else if (oid == 0x01) {
		resp.OID = NciDecoder.OID.NFCEE_MODE_SET;
    } else {
		resp.OID = NciDecoder.OID.RFU;
    }
}

NciDecoder.decodeRfManagement = function(oid, resp) {
	var length = getOctetFromString(resp.packet, resp.cursor++);
    if (oid == 0x00) {
		resp.OID = NciDecoder.OID.RF_DISCOVER_MAP;
    } else if (oid == 0x01) {
		resp.OID = NciDecoder.OID.RF_SET_LISTEN_MODE_ROUTING;
    } else if (oid == 0x02) {
		resp.OID = NciDecoder.OID.RF_GET_LISTEN_MODE_ROUTING;
    } else if (oid == 0x03) {
		resp.OID = NciDecoder.OID.RF_DISCOVER;
    } else if (oid == 0x04) {
		resp.OID = NciDecoder.OID.RF_DISCOVER_SELECT;
    } else if (oid == 0x05) {
		resp.OID = NciDecoder.OID.RF_INTF_ACTIVATED;
    } else if (oid == 0x06) {
		resp.OID = NciDecoder.OID.RF_DEACTIVATE;
		if (resp.MT == NciDecoder.MT.CMD || resp.MT == NciDecoder.MT.NTF) {
			var deact_type_byte = getOctetFromString(resp.packet, resp.cursor++);
			var deact_type = '';
			if (deact_type_byte == 0x00) {
				deact_type = 'Idle Mode';
			} else if (deact_type_byte == 0x01) {
				deact_type = 'Sleep Mode';
			} else if (deact_type_byte == 0x02) {
				deact_type = 'Sleep_AF Mode';
			} else if (deact_type_byte == 0x03) {
				deact_type = 'Discovery';
			} else {
				deact_type = 'RFU';
			}
			resp.dummy = 'Type: ' + deact_type;
			if (resp.MT == NciDecoder.MT.CMD) return;
			
			var deact_reason_byte = getOctetFromString(resp.packet, resp.cursor++);
			var deact_reason = '';
			if (deact_reason_byte == 0x00) {
				deact_reason = 'DH_Request';
			} else if (deact_reason_byte == 0x01) {
				deact_reason = 'Endpoint_Request';
			} else if (deact_reason_byte == 0x02) {
				deact_reason = 'RF_Link_Loss';
			} else if (deact_reason_byte == 0x03) {
				deact_reason = 'NFC-B_Bad_AFI';
			} else {
				deact_reason = 'RFU';
			}
			resp.dummy = resp.dummy + ', Reason: ' + deact_reason;	
		} else {
			var status_byte = getOctetFromString(resp.packet, resp.cursor++);
			resp.dummy = 'Status: ' + NciDecoder.getStatusCode(status_byte);
		}
    } else if (oid == 0x07) {
		resp.OID = NciDecoder.OID.RF_FIELD_INFO;
		var info_byte = getOctetFromString(resp.packet, resp.cursor++);
		var field_generated = '';
		if ((info_byte & 0x01) == 0x01) {
			field_generated = 'Field generated by Remote NFC Endpoint';
		} else if ((info_byte & 0x01) == 0x00) {
			field_generated = 'No field generated by Remote NFC Endpoint';
		}
		resp.dummy = 'Field: ' + field_generated;
    } else if (oid == 0x08) {
		resp.OID = NciDecoder.OID.RF_T3T_POLLING;
    } else if (oid == 0x09) {
		resp.OID = NciDecoder.OID.RF_NFCEE_ACTION;
		var nfcee_id_value = getOctetFromString(resp.packet, resp.cursor++);
		var trigger_byte = getOctetFromString(resp.packet, resp.cursor++);
		var length_support_data = getOctetFromString(resp.packet, resp.cursor++);
		
		var trigger_value;
		if (trigger_byte == 0x00) {
			trigger_value = 'SELECT command with an AID';
		} else if (trigger_byte == 0x01) {
			trigger_value = 'RF Protocol based routing decision';
		} else if (trigger_byte == 0x02) {
			trigger_value = 'RF Technology based routing decision';
		} else if (trigger_byte == 0x03) {
			trigger_value = 'NFCID2 based routing decision';
		} else if (trigger_byte >= 0x10 && trigger_byte <= 0x7F) {
			trigger_value = 'Application specific';
		} else {
			trigger_value = 'RFU';
		}
		
		resp.dummy = 'NfceeId: ' + nfcee_id_value + ', Trigger: ' + trigger_value + ', LengthOfSupportData: ' + length_support_data;
		
		if (length_support_data > 0) {
			var support_data = resp.packet.substr(resp.cursor*2, length_support_data*2);
			resp.cursor += length_support_data;
			resp.dummy += ', SupportData: ' + support_data;
		}
		
    } else if (oid == 0x0A) {
		resp.OID = NciDecoder.OID.RF_NFCEE_DISCOVERY_REQ;
    } else if (oid == 0x0B) {
		resp.OID = NciDecoder.OID.RF_PARAMETER_UPDATE;
    } else if (oid == 0x0C) {
		resp.OID = NciDecoder.OID.RF_LLCP_SYMMETRY_START;
    } else if (oid == 0x0D) {
		resp.OID = NciDecoder.OID.RF_LLCP_SYMMETRY_STOP;
    } else if (oid == 0x0E) {
		resp.OID = NciDecoder.OID.RF_AGGREGATE_ABORT;
    } else {
		resp.OID = NciDecoder.OID.RFU;
    }
}


NciDecoder.decodeNciCore = function(oid, resp) {
	var length = getOctetFromString(resp.packet, resp.cursor++);
    if (oid == 0x00) {
		resp.OID = NciDecoder.OID.CORE_RESET;
		if (resp.MT == NciDecoder.MT.CMD) {
			var reset_type = getOctetFromString(resp.packet, resp.cursor++);
			resp.dummy = 'ResetType: ';
			if (reset_type == 0x00) {
				resp.dummy += 'Keep Configuration';
			} else if (reset_type == 0x01) {
				resp.dummy += 'Reset Configuration';
			} else {
				resp.dummy += 'RFU';
			}
		} else if (resp.MT == NciDecoder.MT.RSP) {
			var status_byte = getOctetFromString(resp.packet, resp.cursor++);
			var nci_version_byte = getOctetFromString(resp.packet, resp.cursor++);
			var config_status_byte = getOctetFromString(resp.packet, resp.cursor++);
			
			var status = NciDecoder.getStatusCode(status_byte);
			var nci_version;
			if (nci_version_byte == 0x10) {
				nci_version = '1.0';
			} else if (nci_version == 0x11) {
				nci_version = '1.0';
			} else {
				nci_version = 'RFU';
			}
			var config_status;
			if (config_status_byte == 0x00) {
				config_status = 'NCI RF Configuration has been kept';
			} else if (config_status_byte == 0x01) {
				config_status = 'NCI RF Configuration has been reset';
			} else {
				config_status = 'RFU';
			}
			
			resp.dummy = 'Status: ' + status + ', NciVersion: ' + nci_version + ', ConfigStatus: ' + config_status;
		} else if (resp.MT = NciDecoder.MT.NTF) {
			var reason_code_byte = getOctetFromString(resp.packet, resp.cursor++);
			var config_status_byte = getOctetFromString(resp.packet, resp.cursor++);
			
			var reason_code;
			if (reason_code_byte == 0x00) {
				reason_code = 'Unspecified reason';
			} else if (reason_code_byte > 0x9F) {
				reason_code = 'For proprietary use';
			} else {
				reason_code = 'RFU';
			}
			
			var config_status;
			if (config_status_byte == 0x00) {
				config_status = 'NCI RF Configuration has been kept';
			} else if (config_status_byte == 0x01) {
				config_status = 'NCI RF Configuration has been reset';
			} else {
				config_status = 'RFU';
			}
			resp.dummy = 'Reason: ' + reason_code + 'ConfigStatus: ' + config_status;
		}
    } else if (oid == 0x01) {
		resp.OID = NciDecoder.OID.CORE_INIT;
    } else if (oid == 0x02) {
		resp.OID = NciDecoder.OID.CORE_SET_CONFIG;
    } else if (oid == 0x03) {
		resp.OID = NciDecoder.OID.CORE_GET_CONFIG;
    } else if (oid == 0x04) {
		resp.OID = NciDecoder.OID.CORE_CONN_CREATE;
    } else if (oid == 0x05) {
		resp.OID = NciDecoder.OID.CORE_CONN_CLOSE;
    } else if (oid == 0x06) {
		resp.OID = NciDecoder.OID.CORE_CONN_CREDITS;
    } else if (oid == 0x07) {
		resp.OID = NciDecoder.OID.CORE_GENERIC_ERROR;
    } else if (oid == 0x08) {
		resp.OID = NciDecoder.OID.CORE_INTERFACE_ERROR;
    } else {
		resp.OID = NciDecoder.OID.RFU;
    }
}

module.exports = NciDecoder;

/*
var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

var instream = fs.createReadStream(process.argv[2]);
var outstream = new stream();
outstream.readable = true;
outstream.writable = false;

var rl = readline.createInterface({
    input: instream,
    output: outstream,
    terminal: false
});

var outLogString = '';
var regexNciTag = /(NciR|NciX)/
var regexNciMsg = /^(\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) (.*?) len = \s*? \d+ > ([0-9a-fA-F]+)$/
rl.on('line', function(line) {
	outLogString += line + '\n';
	var match_Nci_Tag = line.match(regexNciTag);
	if (match_Nci_Tag != null) {
		var match_Nci_Msg = line.match(regexNciMsg);
		var date_time = match_Nci_Msg[1];
		var tag_proc_etc = match_Nci_Msg[2];
		var nci_msg = match_Nci_Msg[3];
		var decoded_msg = NciDecoder.decode(nci_msg);
		var decodedLine = date_time + ' ' + tag_proc_etc + ' ' + decoded_msg.toString();
		outLogString += decodedLine + '\n';
		console.log(decodedLine);
	}
});

rl.on('close', function() {
	fs.writeFile(process.argv[3], outLogString, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 
});*/

},{}]},{},[]);
