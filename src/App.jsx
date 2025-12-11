import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faHighlighter, faSortAmountDownAlt, faSync } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import './App.css';
import icon from './mainicon.png';

function App() {
  const [items, setItems] = useState([]);
  const [optimalChanges, setOptimalChanges] = useState(10);
  const [minimumAges, setMinimumAges] = useState(10);
  const [minimumInitDiv, setMinimumInitDiv] = useState(2.8);
  const [maximumInitDiv, setMaximumInitDiv] = useState(7.8);
  const [sortParam, setSortParam] = useState(['All Members', 'asc']);

  const readExcel = useCallback((file) => {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      
      fileReader.onload = (e) => {
        const bufferArray = e.target.result;
        const wb = XLSX.read(bufferArray, { type: 'buffer' });
        const wslist = wb.SheetNames;
        
        let dataSet = [];
        wslist.forEach((currentSheet) => {
          const ws = wb.Sheets[currentSheet];
          const sheetData = XLSX.utils.sheet_to_json(ws);
          dataSet.push({
            sheetName: currentSheet,
            sheetData: sheetData
          });
        });

        resolve(dataSet);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });

    promise.then((d) => {
      setItems(d);
    });
  }, []);

  const getDataClassNames = useCallback((s) => {
    // Fair Value osztály az __EMPTY_22 alapján (numerikus érték)
    let fairValueClass = '';
    const fairValue = parseFloat(s.__EMPTY_22);
    
    if (!isNaN(fairValue)) {
      if (fairValue <= 0) {
        fairValueClass = 'In_the_Margin_of_Safety'; // Zöld - 0 vagy kisebb
      } else if (fairValue > 0 && fairValue < 10) {
        fairValueClass = 'At_Fair_Value'; // Fehér - 0 és 10 között
      } else {
        fairValueClass = 'Above_Fair_Value'; // Piros - 10 vagy nagyobb
      }
    }
    
    let optimalChangesClass = optimalChanges <= parseFloat((parseFloat(s.__EMPTY_9) + parseFloat(s.__EMPTY_15)).toFixed(3)) ? 'Optimal' : '';
    
    // Ha optimal ÉS nem zöld, akkor csak a fair value színt adjuk vissza (optimal animáció nélkül)
    if (optimalChangesClass !== '' && fairValueClass !== 'In_the_Margin_of_Safety') {
      return fairValueClass;
    }

    // Egyébként mindkettő (lehet zöld+optimal villogás, vagy csak egyik)
    const result = `${fairValueClass} ${optimalChangesClass}`.trim();
    console.log('Row classes:', result, 'FV:', fairValue, 'Optimal:', optimalChangesClass);
    return result;
  }, [optimalChanges]);

  const renderShares = useCallback((dataSet) => {
    if (dataSet.length > 0) {
      let sheetData = dataSet[4].sheetData;
      const headerRow = sheetData[1];
      
      const mainData = sheetData.slice(2);
      for (let d = 0; d < mainData.length; d++) {
        const item = mainData[d];
        
        try {
          const divIncrease = ((parseFloat(item.__EMPTY_9) / (parseFloat(item.__EMPTY_10) * parseInt(item.__EMPTY_8)) - 1) * 100).toFixed(3);
          mainData[d].divIncrease = divIncrease;
        } catch (err) {
          mainData[d].divIncrease = "";
        }
        
        try {
          const divIncrease1Y = (parseFloat(item.__EMPTY_5) + parseFloat(item.__EMPTY_15)).toFixed(3);
          mainData[d].divIncrease1Y = divIncrease1Y;
        } catch (err) {
          mainData[d].divIncrease1Y = "";
        }

        try {
          const divIncrease5Y = (parseFloat(item.__EMPTY_5) + parseFloat(item.__EMPTY_17)).toFixed(3);
          mainData[d].divIncrease5Y = divIncrease5Y;
        } catch (err) {
          mainData[d].divIncrease5Y = "";
        }
      }

      // Sort data
      if (sortParam[1] === 'asc') {
        if (sortParam[0] === 'divIncrease1Y' || sortParam[0] === 'divIncrease') {
          mainData.sort((a, b) => parseFloat(a[sortParam[0]]) > parseFloat(b[sortParam[0]]) ? 1 : -1);
        } else {
          mainData.sort((a, b) => a[sortParam[0]] > b[sortParam[0]] ? 1 : -1);
        }
      } else {
        if (sortParam[0] === 'divIncrease1Y' || sortParam[0] === 'divIncrease') {
          mainData.sort((a, b) => parseFloat(a[sortParam[0]]) < parseFloat(b[sortParam[0]]) ? 1 : -1);
        } else {
          mainData.sort((a, b) => a[sortParam[0]] < b[sortParam[0]] ? 1 : -1);
        }
      }

      return (
        <div className='tableFixHead'>
          <table className="table">
            <thead>
              <tr className='DataHeader'>
                <th>#</th>
                <th>{headerRow['All Members']}</th>
                <th>{headerRow.__EMPTY}</th>
                <th>{headerRow.__EMPTY_2}</th>
                <th>{headerRow.__EMPTY_3}</th>
                <th>{headerRow.__EMPTY_4}</th>
                <th className='InportantColumn'>{headerRow.__EMPTY_5} %</th>
                <th>{headerRow.__EMPTY_10}</th>
                <th>{headerRow.__EMPTY_7}</th>
                <th>{headerRow.__EMPTY_9}</th>
                <th className='InportantColumn'>Div increase %</th>
                <th className='InportantColumn'>Div increase (1Y GDR)</th>
                <th>Div increase (5Y DGR)</th>
                <th>{headerRow.__EMPTY_11}</th>
                <th>{headerRow.__EMPTY_12}</th>
                <th className='InportantColumn'>{headerRow.__EMPTY_15}</th>
                <th>{headerRow.__EMPTY_16}</th>
                <th>{headerRow.__EMPTY_17}</th>
                <th>{headerRow.__EMPTY_18}</th>
                <th>{headerRow.__EMPTY_19}</th>
                <th>{headerRow.__EMPTY_20}</th>
                <th>{headerRow.__EMPTY_8}</th>
                <th className='InportantColumn'>{headerRow.__EMPTY_22}</th>
                <th>{headerRow.__EMPTY_21}</th>
              </tr>
            </thead>
            <tbody>
              {mainData.map((s, index) => (
                index > 1 && 
                (parseInt(s.__EMPTY_3) >= minimumAges || minimumAges === 0) && 
                (parseFloat(s.__EMPTY_5) >= minimumInitDiv || minimumInitDiv === 0) && 
                (parseFloat(s.__EMPTY_5) <= maximumInitDiv || maximumInitDiv === 0) ? (
                  <tr key={index} className={getDataClassNames(s)}>
                    <th scope="row">{index - 1}</th>
                    <td>{s['All Members']}</td>
                    <td>{s.__EMPTY}</td>
                    <td>{s.__EMPTY_2}</td>
                    <td>{s.__EMPTY_3}</td>
                    <td>{s.__EMPTY_4}</td>
                    <td className='InportantColumn'>{s.__EMPTY_5}</td>
                    <td>{s.__EMPTY_10}</td>
                    <td>{s.__EMPTY_7}</td>
                    <td>{s.__EMPTY_9}</td>
                    <td className='InportantColumn'>{s.divIncrease}</td>
                    <td className='InportantColumn'>{s.divIncrease1Y}</td>
                    <td>{s.divIncrease5Y}</td>
                    <td>{XLSX.SSF.format('yyyy-mm-dd', s.__EMPTY_11)}</td>
                    <td>{XLSX.SSF.format('yyyy-mm-dd', s.__EMPTY_12)}</td>
                    <td className='InportantColumn'>{s.__EMPTY_15}</td>
                    <td>{s.__EMPTY_16}</td>
                    <td>{s.__EMPTY_17}</td>
                    <td>{s.__EMPTY_18}</td>
                    <td>{s.__EMPTY_19}</td>
                    <td>{s.__EMPTY_20}</td>
                    <td>{s.__EMPTY_8}</td>
                    <td className='InportantColumn'>{s.__EMPTY_22}</td>
                    <td>{s.__EMPTY_21}</td>
                  </tr>
                ) : null
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }, [sortParam, minimumAges, minimumInitDiv, maximumInitDiv, getDataClassNames]);

  const getFileUpdateDate = useCallback((dataSet) => {
    if (dataSet.length > 0) {
      return (
        <div className='DataUpdated'>
          File date: {items ? XLSX.SSF.format('yyyy-mm-dd', items[0].sheetData[4].__EMPTY) : ''}
        </div>
      );
    }
  }, [items]);

  const handleOptimalChangesChange = (e) => {
    setOptimalChanges(parseFloat(e.target.value));
  };

  const handleMinimumAgesChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 99) {
      setMinimumAges(value);
    }
  };

  const handleMinimumInitDivChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value < maximumInitDiv) {
      setMinimumInitDiv(value);
    }
  };

  const handleMaximumInitDivChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > minimumInitDiv) {
      setMaximumInitDiv(value);
    }
  };

  const handleSort = (e) => {
    const input = e.target.value;
    let tempSortParam = ['All Members', 'asc'];
    
    const sortMapping = {
      'abc_asc': ['All Members', 'asc'],
      'abc_desc': ['All Members', 'desc'],
      'sector_asc': ['__EMPTY_2', 'asc'],
      'sector_desc': ['__EMPTY_2', 'desc'],
      'year_asc': ['__EMPTY_3', 'asc'],
      'year_desc': ['__EMPTY_3', 'desc'],
      'price_asc': ['__EMPTY_4', 'asc'],
      'price_desc': ['__EMPTY_4', 'desc'],
      'divyield_asc': ['__EMPTY_5', 'asc'],
      'divyield_desc': ['__EMPTY_5', 'desc'],
      'paydate_asc': ['__EMPTY_12', 'asc'],
      'paydate_desc': ['__EMPTY_12', 'desc'],
      'fv_asc': ['__EMPTY_22', 'asc'],
      'fv_desc': ['__EMPTY_22', 'desc'],
      'divincrease_asc': ['divIncrease', 'asc'],
      'divincrease_desc': ['divIncrease', 'desc'],
      'divrationalincrease_asc': ['divIncrease1Y', 'asc'],
      'divrationalincrease_desc': ['divIncrease1Y', 'desc']
    };

    tempSortParam = sortMapping[input] || tempSortParam;
    setSortParam(tempSortParam);
  };

  const resetFilters = () => {
    setMinimumAges(10);
    setOptimalChanges(10);
    setMinimumInitDiv(2.8);
    setMaximumInitDiv(7.8);
    setSortParam(['All Members', 'asc']);
  };

  return (
    <div className='App'>
      <div className='Header'>
        <img className='mainIcon' src={icon} alt="Logo" />
        <h2>Choose-a-Share</h2>
        <label className='versionNumber'>(Version: 20241211 - Vite)</label>
        <div className='legalInformation'>
          <label>
            Copyright {new Date().getFullYear()},{' '}
            <a href='https://cloudsteak.com' rel='noopener noreferrer' target='_blank'>
              CloudSteak
            </a>
          </label>
          (
          <label>
            <a href='https://github.com/the1bit/cm-choose-a-share' rel='noopener noreferrer' target='_blank'>
              Source code on Github
            </a>
          </label>
          )
          <br />
          <label>
            <a href='https://www.multpl.com/s-p-500-dividend-yield' rel='noopener noreferrer' target='_blank'>
              <strong>S&P 500 Info</strong>
            </a>
          </label>
          <br />
          Usage:
          <ol>
            <li>
              Get the latest <strong>Dividend Radar</strong> xlsx{' '}
              <a href='https://www.portfolio-insight.com/dividend-radar' rel='noopener noreferrer' target='_blank'>
                here
              </a>
            </li>
            <li>Upload with 'choose file' then filter the result</li>
          </ol>
        </div>
      </div>
      
      <div>{getFileUpdateDate(items)}</div>
      
      <input
        className='fileChooser'
        type='file'
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) readExcel(file);
        }}
      />
      
      <hr />
      
      <div>
        <label>
          <FontAwesomeIcon icon={faHighlighter} />
          &nbsp;&nbsp;Optimal DIV Changes (%):
        </label>
        &nbsp;
        <input
          type='number'
          onChange={handleOptimalChangesChange}
          min={0.5}
          max={99.9}
          value={optimalChanges}
        />
        &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
        
        <label>
          <FontAwesomeIcon icon={faFilter} />
          &nbsp;&nbsp;Min. Initial DIV (%):
        </label>
        &nbsp;
        <input
          type='number'
          onChange={handleMinimumInitDivChange}
          min={0.1}
          step={0.1}
          max={99.9}
          value={minimumInitDiv}
        />
        &nbsp;&nbsp;&nbsp;&nbsp;
        
        <label>Max. Initial DIV (%):</label>
        &nbsp;
        <input
          type='number'
          onChange={handleMaximumInitDivChange}
          min={1.5}
          step={0.1}
          max={99.9}
          value={maximumInitDiv}
        />
        &nbsp;&nbsp;&nbsp;&nbsp;
        
        <label>Minimum Ages (Year):</label>
        &nbsp;
        <input
          type='number'
          onChange={handleMinimumAgesChange}
          min={5}
          max={100}
          step={1}
          value={minimumAges}
        />
        &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
        
        <label>
          <FontAwesomeIcon icon={faSortAmountDownAlt} /> Sort by:
        </label>
        &nbsp;
        <select onChange={handleSort} value={`${sortParam[0] === 'All Members' ? 'abc' : sortParam[0].includes('divIncrease') ? sortParam[0] : sortParam[0]}_${sortParam[1]}`}>
          <option value='abc_asc'>Alphabetic (Asc)</option>
          <option value='abc_desc'>Alphabetic (Desc)</option>
          <option value='sector_asc'>Sector (Asc)</option>
          <option value='sector_desc'>Sector (Desc)</option>
          <option value='year_asc'>Years (Asc)</option>
          <option value='year_desc'>Years (Desc)</option>
          <option value='price_asc'>Price (Asc)</option>
          <option value='price_desc'>Price (Desc)</option>
          <option value='divyield_asc'>Div Yield (Asc)</option>
          <option value='divyield_desc'>Div Yield (Desc)</option>
          <option value='divincrease_asc'>Div Increase (Asc)</option>
          <option value='divincrease_desc'>Div Increase (Desc)</option>
          <option value='divrationalincrease_asc'>Div Rational Increase (Asc)</option>
          <option value='divrationalincrease_desc'>Div Rational Increase (Desc)</option>
          <option value='paydate_asc'>Pay Date (Asc)</option>
          <option value='paydate_desc'>Pay Date (Desc)</option>
          <option value='fv_desc'>Fair Value % (Asc)</option>
          <option value='fv_asc'>Fair Value % (Desc)</option>
        </select>
        &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
        
        <button type='button' onClick={resetFilters}>
          <FontAwesomeIcon icon={faSync} /> Reset Filter & Sort
        </button>
      </div>
      
      <hr />
      
      <div>{renderShares(items)}</div>
    </div>
  );
}

export default App;
