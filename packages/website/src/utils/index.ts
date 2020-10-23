import TreeModel from 'tree-model'
import { compose } from 'ramda'

export const treeModel = new TreeModel()

/**
 * 递归替换对象节点属性的名称
 * @param source {Object}
 * @param sourceProp {String} 待转换对象原来节点属性的名称
 * @param targetProp {String} 新的节点属性的名称
 * @returns {Object} 节点属性名称转换后的对象
 */
export function replaceProp(source: object, sourceProp: string, targetProp: string) {
  return compose(
    JSON.parse,
    str => str.replace(new RegExp(`"${sourceProp}"`, 'g'), `"${targetProp}"`),
    JSON.stringify
  )(source)
}

/**
 *  铺平树形结构 成 一行行的数据
 * @param  {Object} source 原始的层次结构对象（树形结构对象）
 * @param childrenProp {String} 层次结构对象的子节点的属性
 */


export function flattenHierarchyToRows(source: object, childrenProp: string) {
  // 使用了TreeModel的相关方法 node.getPath node.hasChildren   http://jnuno.com/tree-model-js
  const treeModel = new TreeModel({
    childrenPropertyName: childrenProp,
  })

  let treeNode = treeModel.parse(source)

  let res: any[] = []
  ;(function _inner(nodeLists) {
    if (Array.isArray(nodeLists)) {
      nodeLists.forEach(node => {
        if (node.hasChildren()) {
          _inner(node.children)
        } else {
          let path = node.getPath()
          path.shift()
          // @ts-ignore
          res.push(path.map(item => item.model))
        }
      })
    }
  })(treeNode.children)
  return res
}

export function isEmptyObject(obj:object) {
  return Object.keys(obj).length === 0
}


export const toGrid = tableData => {
  const colModel = tableData.row.headers
    .map(title => {
      return { title }
    })
    .concat(replaceProp(tableData.column.nodes, 'nodes', 'children'))

  const {
    measure: { nameShowAt, headers: measureHeaders },
    dimension: {
      row: { headers: rowHeaders },
      column: { headers: columnheaders },
      l,
    },
  } = tableData

  const dimensions = []
    .concat(rowHeaders)
    .concat(columnheaders)
    .filter(item => item.dID !== '-99')
  const measures = measureHeaders

  /*const setDataType = colModel => {
    colModel.forEach(col => {
      const colTree = treeTool.parse(col)
      const nodes = colTree.all(({ children }) => {
        return children.length === 0
      })
      nodes.forEach(({ model }) => {
        model.sortType = (rowData1, rowData2, dataIndx) => {
          let c1 = get(rowData1, [dataIndx, 'rd'], ''),
            c2 = get(rowData2, [dataIndx, 'rd'], '')
          if (c1 > c2) {
            return 1
          } else if (c1 < c2) {
            return -1
          } else {
            return 0
          }
        }
      })
    })
  }

  if (nameShowAt === 'column') {
    setDataType(colModel)
  }*/

  const rowNodes = flattenHierarchyToRows(tableData.row, 'nodes')
  if (tableData.measure.nameShowAt === 'row' && !tableData.column.headers.length) {
    colModel.push({ title: '' })
  }
  const data = tableData.data.map((item, index) => {
    const rowData = rowNodes[index] || []
    return [].concat(rowData).concat(item)
  })
  return {
    colModel,
    dataModel: {
      data,
    },
    dimensions,
    measures,
  }
}

export const toChart = (tableData, splitModel, legends) => {
  const rowNodes = flattenHierarchyToRows(tableData.row, 'nodes')
  return tableData.data.map((item, index) => {
    const row = {
      _measureValue: '度量值',
      _data: {},
    }
    const rowData = rowNodes[index] || []
    rowData.forEach((data, i) => {
      row[tableData.row.headers[i]] = data.rd
      row._data[tableData.row.headers[i]] = data
    })
    if (legends.length > 1) {
      let legendUnion = legends.map(item => item.caption)
      row[`_${legendUnion.join('*')}`] = legendUnion.map(name => row[name]).join(' ')
    }
    item.forEach((data, i) => {
      if (tableData.measure.nameShowAt === 'row') {
        row['measure-value'] = +data.rd
        row._data['measure-value'] = data
      } else {
        row[tableData.measure.headers[i].title] = +data.rd
        row._data[tableData.measure.headers[i].title] = data
      }
    })
    return row
  })
  /*return rowNodes.map((rowData, indx) => {
      const row = {
          _measureValue: '度量值',
          _data: {},
      }
      rowData.forEach((data, i) => {
          row[tableData.row.headers[i]] = data.rd
          row._data[tableData.row.headers[i]] = data
      })
      if (legends.length > 1) {
          let legendUnion = legends.map(item => item.caption)
          row[`_${legendUnion.join('*')}`] = legendUnion.map(name => row[name]).join(' ')
      }
      tableData.data[indx].forEach((data, i) => {
          if (tableData.measure.nameShowAt === 'row') {
              row['measure-value'] = +data.rd
              row._data['measure-value'] = data
          } else {
              row[tableData.measure.headers[i].title] = +data.rd
              row._data[tableData.measure.headers[i].title] = data
          }
      })
      return row
  })*/
}
