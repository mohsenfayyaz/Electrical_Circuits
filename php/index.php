<?php
    include '../vendor/autoload.php';
    include 'config.php';
    use Phpml\Math\Matrix;
?>
<?php
    $rest_json = file_get_contents("php://input");
    $_POST = json_decode($rest_json, true);
    //var_dump($_POST);
    $nodesData = $_POST["nodes"];

    $resistors = new ArrayObject;
    $nodes = new ArrayObject;
    $vSources = new ArrayObject;
    $iSources = new ArrayObject;

    $gndFound = false;
    foreach($nodesData as $nodeId => $node){
        $myNode = getNodeInfo($node);
        if($myNode['name'] == $NODE_RESISTOR){
            $resistors->append($myNode);
        }
        if($myNode['name'] == $NODE_VS || $myNode['name'] == $NODE_VS_REVERSE){
            $vSources->append($myNode);
        }
        if($myNode['name'] == $NODE_IS || $myNode['name'] == $NODE_IS_REVERSE){
            $iSources->append($myNode);
        }
        if($myNode['name'] == $NODE_NODE){
            if($myNode['number'] != $NODE_GND){ //GND NODE WILL BE IGNORED
                $nodes->append($myNode);
            }else{
                if($gndFound){
                    die("There are more than 1 GROUND Nodes!<br>(GND nodes are specified by -1)");
                }else{
                    $gndFound = true;
                }
            }
        }

        //var_dump($value);
    }

    if($gndFound==false){
        die("Please specify the GND node by entering -1 in it");
    }

    $nodesResistance = detectResistors($resistors);
    $nodesVoltage = detectVSs($vSources);

    


 

    $matrixR = makeMatrixR($nodes, $nodesResistance);
    $matrixV = makeMatrixV($nodes, $vSources, $nodesVoltage);
    $matrixRV = makeMatrixRV($matrixR, $matrixV, $vSources);

    $matrixIsVs = makeMatrixIsVs($nodes, $iSources, $vSources);

    $matrixRV = new Matrix((array)$matrixRV);
    $mrvSave = $matrixRV;
    $matrixRV = $matrixRV->inverse();
    $matrixIsVs = Matrix::fromFlatArray((array)$matrixIsVs);

    $answerMatrix = $matrixRV->multiply($matrixIsVs);

    //var_dump($matrixRV);
    //var_dump($matrixIsVs);
    //var_dump($answerMatrix);

    $answerMatrix = $answerMatrix->toArray();
    $j=0;
    for($i=0;$i<count($nodes);$i++){
        $j++;
        $a['data'][$nodes[$i]["id"]]["value"] = $answerMatrix[$i];
        $a['data'][$nodes[$i]["id"]]['type'] = "NodeVoltage";
    }
    for($i=0;$i<count($vSources);$i++){
        $a['data'][$vSources[$i]["id"]]['value'] = $answerMatrix[$i+$j];
        $a['data'][$vSources[$i]["id"]]['type'] = "VSCurrent";
        $a['data'][$vSources[$i]["id"]]['volt'] = $vSources[$i]["number"];
    }

    $a['matrixRV'] = $mrvSave;
    $a['matrixIsVs'] = $matrixIsVs;
    echo json_encode($a);
    
?>


<?php

    function getNodeInfo($node){
        $myNode['id'] = $node['id'];
        $myNode['number'] = getDataNumber($node);
        $myNode['name'] = $node['name'];
        $myNode['inputsIds'] = getInputsIds($node);
        $myNode['ouputsIds'] = getOutputsIds($node);
        return $myNode;
    }

    function makeMatrixIsVs($nodes, $iSources, $vSources){
        global $NODE_IS;
        $matrixIsVs = new ArrayObject;
        foreach($iSources as $is){
            if($is['name'] == $NODE_IS){
                $isValue = $is['number'];
            }else{
                $isValue = -$is['number'];
            }
            foreach($is['inputsIds'] as $id){
                $nodeIs[$id] = -$isValue;
            }
            foreach($is['ouputsIds'] as $id){
                $nodeIs[$id] = +$isValue;
            }
        }
        foreach($nodes as $node){
            if(isset($nodeIs[$node["id"]])){
                $matrixIsVs->append($nodeIs[$node["id"]]);
            }else{
                $matrixIsVs->append(0);
            }
        }
        foreach($vSources as $vSource){
            $matrixIsVs->append($vSource["number"]);
        }

        return $matrixIsVs;
    }

    function makeMatrixRV($matrixR, $matrixV, $vSources){
        //$matrixR = new matrix($matrixR);
        //$matrixV = new matrix($matrixV);
        $matrixVTranspose = new matrix($matrixV);
        $matrixVTranspose = $matrixVTranspose->transpose();
        $matrixVTranspose = $matrixVTranspose->toArray();

        $i=0;
        foreach($matrixV as $v){ // TOP RIGHT CONNECTING
            foreach($v as $v2){
                array_push($matrixR[$i], $v2);
            }
            $i++;
        }
        $matrixRV = $matrixR;

        foreach($matrixVTranspose as $key => $mvt){ //DOWN CONNECTING
            foreach($vSources as $v){
                array_push($matrixVTranspose[$key], 0);
            }
            array_push($matrixRV, $matrixVTranspose[$key]);
        }



        return $matrixRV;

    }

    function makeMatrixV($nodes, $vSources, $nodesVoltage){ // TOP RIGHT OF RV MATRIX
        $i = 0; $j = 0;
        $matrixV = [];
        foreach($nodes as $node){
            $i=0;
            foreach($vSources as $vSource){

                if(isset($nodesVoltage[$vSource['id']][$node['id']])){
                    $matrixV[$j][$i] = $nodesVoltage[$vSource['id']][$node['id']];
                }else{
                    $matrixV[$j][$i] = 0;
                }

                $i++;  
            }
            $j++;
        }
        return $matrixV;
    }

    function makeMatrixR($nodes, $nodesResistance){
        $i = 0; $j = 0;
        foreach($nodes as $node1){
            $i=0;
            foreach($nodes as $node2){
                
                if(isset($nodesResistance[$node1['id']][$node2['id']])){
                    $matrixR[$j][$i] = $nodesResistance[$node1['id']][$node2['id']];
                }else{
                    $matrixR[$j][$i] = 0;
                }

                $i++;  
            }
            $j++;
        }
        return $matrixR;
    }

    function detectResistors($resistors){

        foreach($resistors as $myNode){

            $inNodeId = $myNode['inputsIds'][0];
            $outNodeId = $myNode['ouputsIds'][0];
            $resistorValue = 1/$myNode['number'];

            if(isset($nodesResistance[$inNodeId][$inNodeId])){
                $nodesResistance[$inNodeId][$inNodeId] += $resistorValue;
            }else{
                $nodesResistance[$inNodeId][$inNodeId] = $resistorValue;
            }
            
            if(isset($nodesResistance[$outNodeId][$outNodeId])){
                $nodesResistance[$outNodeId][$outNodeId] += $resistorValue;
            }else{
                $nodesResistance[$outNodeId][$outNodeId] = $resistorValue;
            }

            if(isset($nodesResistance[$inNodeId][$outNodeId])){
                $nodesResistance[$inNodeId][$outNodeId] -= $resistorValue;
                $nodesResistance[$outNodeId][$inNodeId] -= $resistorValue;
            }else{
                $nodesResistance[$inNodeId][$outNodeId] = -$resistorValue;
                $nodesResistance[$outNodeId][$inNodeId] = -$resistorValue;
            }
            
        }
        return $nodesResistance;
    }

    function detectVSs($vSources){
        global $NODE_VS;
        foreach($vSources as $myNode){

            if($myNode['name'] == $NODE_VS){
                $v = +1;
            }else{
                $v = -1;
            }
            $inNodeId = $myNode['inputsIds'][0];
            $outNodeId = $myNode['ouputsIds'][0];

            $nodesVoltage[$myNode['id']][$inNodeId] = -$v;
            $nodesVoltage[$myNode['id']][$outNodeId] = $v;

        }

        return $nodesVoltage;
    }

    function getDataNumber($node){
        return $node['data']['msg'];
    }

    function getInputsIds($node){
        $inputsIdsArray = array();
        foreach($node['inputs'] as $key => $input){
            if(!empty($input['connections'])){
                $newInput = $input['connections'][0]['node'];
                array_push($inputsIdsArray, $newInput);
            }
            
        }
        return $inputsIdsArray;
    }

    function getOutputsIds($node){
        $outputsIdsArray = array();
        foreach($node['outputs'] as $key => $output){
            if(!empty($output['connections'])){
                $newOutput = $output['connections'][0]['node'];
                array_push($outputsIdsArray, $newOutput);
            }
        }
        return $outputsIdsArray;
    }
?>