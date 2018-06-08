# Import Dependencies

from flask import Flask, render_template, jsonify, redirect
from flask_pymongo import PyMongo
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, desc,select

import pandas as pd 
import numpy as np 

#################################################
# Database Setup
#################################################
engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")
# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)
# Save reference to table
OTU = Base.classes.otu
Samples = Base.classes.samples
Samples_Metadata = Base.classes.samples_metadata 

# Create session from python to use Database
session = Session(engine)


app = Flask(__name__)

##################################################
################   Flask Routes ##################
##################################################
## Home page ##
@app.route('/')
def homepage():
    return render_template("index.html")

## Return a list of sample names ##

@app.route('/names')
def samplenames():
    name_results = session.query(Samples).statement
    #print(results)
    sample_names_df = pd.read_sql_query(name_results, session.bind)
    sample_names_df.set_index('otu_id', inplace=True)
    sample_names_df.head()
    # return the list of samples names from the above dataframe
    return jsonify(list(sample_names_df.columns))

# Return a list of OTU descriptions    
@app.route('/otu')
def otu():

    otu_results = session.query(OTU.lowest_taxonomic_unit_found).all()
    #otu_df = pd.read_sql_query(otu_results,session.bind)
    otu_descriptions_list = []
    for data in otu_results:
        otu_descriptions_list.append(data[0])    
    #otu_descriptions_listresults
    return jsonify(otu_descriptions_list)

@app.route('/metadata/<sample>')
def metaData(sample):

    sel = [Samples_Metadata.SAMPLEID,Samples_Metadata.ETHNICITY,
       Samples_Metadata.GENDER, Samples_Metadata.AGE,
       Samples_Metadata.LOCATION,Samples_Metadata.BBTYPE]
    metadata_results = session.query(*sel).filter(Samples_Metadata.SAMPLEID == sample[3:]).all()
    #print(metadata_results)
    sample_metadata = {}
    for result in metadata_results:
        sample_metadata["Sample ID"] = result[0]
        sample_metadata["ETHNICITY"] = result[1]
        sample_metadata["GENDER"] = result[2]
        sample_metadata["AGE"] = result[3]
        sample_metadata["LOCATION"] = result[4]
        sample_metadata["BBTYPE"] = result[5]

    return jsonify(sample_metadata)


@app.route('/wfreq/<sample>')
def wfreq(sample):
    wash_frequency = session.query(Samples_Metadata.WFREQ).\
                    filter(Samples_Metadata.SAMPLEID == sample[3:]).all()[0][0]
    return jsonify(int(wash_frequency))
    
@app.route('/samples/<sample>')
def samples(sample):
    sample_results = session.query(Samples).statement
    #print(results)
    sample_names_df = pd.read_sql_query(sample_results, session.bind)
    sample_names_df = sample_names_df[sample_names_df[sample]>1].sort_values(by=sample,ascending=False)
    sample_output = [{ "otu_ids": sample_names_df[sample].index.values.tolist(),"sample_values": sample_names_df[sample].values.tolist()}]
    return jsonify(sample_output)

if __name__ == "__main__":
    app.run(debug=True)
