/**
 * return a table row.
 * @param {currencyObjed} currency a currency object
 *
 */
function createTableRow(currency) {
	const tr = document.createElement("tr");
	if (currency.changeBy < 0) {
		tr.classList = "text-danger";
	} else if (currency.changeBy > 0) {
		tr.classList = "text-success";
	}
	const code = document.createElement("th");
	code.scope = "row";
	code.innerText = currency.code;
	const name = document.createElement("td");
	name.innerText = currency.name;
	name.innerText = tr.append(code, name);
	return tr;
}

/*
<tr>
  <th scope="row">1</th>
  <td>Mark</td>
  <td>Otto</td>
  <td>@mdo</td>
</tr>
*/
